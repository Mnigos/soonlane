import { Effect, Layer, Redacted } from 'effect'
import { createTransport } from 'nodemailer'
import {
	AppConfig,
	type EmailConfig,
	type EmailTransport,
} from '@/platform/config/app.config'
import { Email } from '../application/email.port'
import {
	type MailContent,
	toSignInCodeMail,
} from '../domain/sign-in-code-mail.helper'

const RESEND_URL = 'https://api.resend.com/emails'
const SEND_TIMEOUT_MS = 10_000

interface OutgoingMail extends MailContent {
	from: string
	to: string
}

type SendMail = (mail: OutgoingMail) => Effect.Effect<void, string>

/** Fails with the HTTP status only: Resend's error body can echo the recipient. */
function resendSender(apiKey: Redacted.Redacted): SendMail {
	return mail =>
		Effect.tryPromise({
			try: async () => {
				const answer = await fetch(RESEND_URL, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${Redacted.value(apiKey)}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(mail),
					signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
				})

				await answer.body?.cancel()

				return answer.status
			},
			catch: error => (error instanceof Error ? error.name : 'unknown'),
		}).pipe(
			Effect.flatMap(status =>
				status < 300 ? Effect.void : Effect.fail(`HTTP ${status}`)
			)
		)
}

/** Fails with nodemailer's error code only: its messages can hold the server's reply and the address. */
function smtpSender(url: Redacted.Redacted): SendMail {
	const transport = createTransport({
		url: Redacted.value(url),
		connectionTimeout: SEND_TIMEOUT_MS,
		socketTimeout: SEND_TIMEOUT_MS,
	})

	return mail =>
		Effect.tryPromise({
			try: async () => await transport.sendMail(mail),
			catch: error =>
				error instanceof Error && 'code' in error
					? String(error.code)
					: 'unknown',
		})
}

/** Development without a mail provider: the code goes to the API's log. */
const logSender: SendMail = mail => Effect.logInfo(`[Email] ${mail.subject}`)

function toSender(transport: EmailTransport): SendMail {
	if (transport.kind === 'resend') return resendSender(transport.apiKey)

	return transport.kind === 'smtp' ? smtpSender(transport.url) : logSender
}

function toEmail({ from, transport }: EmailConfig) {
	const send = toSender(transport)

	return Email.of({
		sendSignInCode: ({ to, code }) =>
			send({ from, to, ...toSignInCodeMail(code) }).pipe(
				Effect.tapError(reason =>
					Effect.logWarning(`[Email] A sign-in code was not sent: ${reason}.`)
				),
				Effect.ignore
			),
	})
}

/** Sends nothing: without email settings the server offers no email sign-in, so nothing asks it to. */
const disabledEmail = Email.of({ sendSignInCode: () => Effect.void })

/** Mail through the transport `AppConfig` names; a failed send is logged with a status or code, never the address or the code. */
export const EmailLive = Layer.effect(
	Email,
	Effect.gen(function* () {
		const { email } = yield* AppConfig

		return email ? toEmail(email) : disabledEmail
	})
)
