import { EMAIL_CODE_LENGTH, TOO_MANY_CODES } from '@soonlane/auth'
import { sendEmailCode, signInWithEmailCode } from '@soonlane/auth/client'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { Button } from '@soonlane/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import { type SubmitEvent, useState } from 'react'
import { EMAIL_CODE_COPY } from '../email-code-copy.constants'
import { SIGN_IN_FAILED } from './continue-with-google'

const FIELD_CLASS =
	'h-10 rounded-md border border-border-strong bg-background px-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
const LINK_CLASS =
	'cursor-pointer self-start text-caption text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50'

/** What Better Auth's `$fetch` reports for a refused request. */
interface AuthFetchError {
	status: number
	code?: string
}

function toSendError({ status, code }: AuthFetchError) {
	if (code === TOO_MANY_CODES) return EMAIL_CODE_COPY.tooManyCodes

	return status === 429
		? EMAIL_CODE_COPY.tooManyAttempts
		: EMAIL_CODE_COPY.sendFailed
}

function toSignInError({ status, code }: AuthFetchError) {
	if (code === 'INVALID_OTP') return EMAIL_CODE_COPY.invalidCode
	if (code === 'SIGN_UPS_CLOSED') return ACCESS_ERROR_MESSAGES.SIGN_UPS_CLOSED

	return status === 429 ? EMAIL_CODE_COPY.tooManyAttempts : SIGN_IN_FAILED
}

/** A refusal becomes its message; a request that never got an answer becomes the plain fallback, never the browser's own wording. */
async function send(email: string) {
	try {
		const { error } = await sendEmailCode(email)

		if (error) return new Error(toSendError(error))
	} catch {
		return new Error(EMAIL_CODE_COPY.sendFailed)
	}

	return email
}

async function signIn(email: string, code: string) {
	try {
		const { error } = await signInWithEmailCode(email, code)

		return error ? new Error(toSignInError(error)) : undefined
	} catch {
		return new Error(SIGN_IN_FAILED)
	}
}

interface EmailCodeSignInProps {
	/** The account's own address, for signing in again before deleting it; the field is then hidden and cannot change. */
	fixedEmail?: string
	/** Runs once this browser holds the new session, and only while this form is still shown: a dialog closed meanwhile never acts on it. */
	onSignedIn: () => void
}

/** Sign-in with a code mailed to the address: the address first, then the code; the first sign-in creates the account. */
export function EmailCodeSignIn({
	fixedEmail,
	onSignedIn,
}: Readonly<EmailCodeSignInProps>) {
	const [email, setEmail] = useState(fixedEmail ?? '')
	const [code, setCode] = useState('')
	const [sentTo, setSentTo] = useState<string>()
	const [hasResent, setHasResent] = useState(false)
	const sending = useMutation({
		mutationFn: async (address: string) => {
			const sent = await send(address)

			if (sent instanceof Error) throw sent

			return sent
		},
		onSuccess: address => {
			setHasResent(address === sentTo)
			setSentTo(address)
		},
	})
	const signingIn = useMutation({
		mutationFn: async (address: string) => {
			const failure = await signIn(address, code)

			if (failure) throw failure
		},
	})
	const error = signingIn.error ?? sending.error
	const isBusy = sending.isPending || signingIn.isPending || signingIn.isSuccess

	function submitEmail(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		sending.mutate(email)
	}

	function submitCode(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		// The callback goes with this call, so it is dropped when the form unmounted meanwhile.
		if (sentTo) signingIn.mutate(sentTo, { onSuccess: onSignedIn })
	}

	function changeEmail() {
		sending.reset()
		signingIn.reset()
		setSentTo(undefined)
		setHasResent(false)
		setCode('')
	}

	return (
		<div className="flex flex-col gap-3">
			{sentTo ? (
				<form className="flex flex-col gap-3" onSubmit={submitCode}>
					<p className="ph-mask text-sm text-muted-foreground">
						{hasResent
							? EMAIL_CODE_COPY.resent(sentTo)
							: EMAIL_CODE_COPY.sentTo(sentTo)}
					</p>

					<input
						aria-label={EMAIL_CODE_COPY.codeLabel}
						autoComplete="one-time-code"
						autoFocus
						className={`${FIELD_CLASS} tracking-[0.3em] tabular-nums`}
						inputMode="numeric"
						onChange={event =>
							setCode(
								event.target.value
									.replaceAll(/\D/gu, '')
									.slice(0, EMAIL_CODE_LENGTH)
							)
						}
						pattern={`\\d{${EMAIL_CODE_LENGTH}}`}
						required
						value={code}
					/>

					<Button disabled={isBusy} size="lg" type="submit">
						{signingIn.isPending || signingIn.isSuccess
							? EMAIL_CODE_COPY.signingIn
							: EMAIL_CODE_COPY.signIn}
					</Button>

					<div className="flex flex-wrap gap-x-4 gap-y-1">
						<button
							className={LINK_CLASS}
							disabled={isBusy}
							onClick={() => {
								signingIn.reset()
								sending.mutate(sentTo)
							}}
							type="button"
						>
							{EMAIL_CODE_COPY.resend}
						</button>

						{!fixedEmail && (
							<button
								className={LINK_CLASS}
								disabled={isBusy}
								onClick={changeEmail}
								type="button"
							>
								{EMAIL_CODE_COPY.otherEmail}
							</button>
						)}
					</div>
				</form>
			) : (
				<form className="flex flex-col gap-3" onSubmit={submitEmail}>
					{!fixedEmail && (
						<input
							aria-label={EMAIL_CODE_COPY.emailLabel}
							autoComplete="email"
							className={`ph-mask ${FIELD_CLASS}`}
							onChange={event => setEmail(event.target.value)}
							placeholder={EMAIL_CODE_COPY.emailPlaceholder}
							required
							type="email"
							value={email}
						/>
					)}

					<Button
						disabled={sending.isPending}
						size="lg"
						type="submit"
						variant={fixedEmail ? 'primary' : 'outline'}
					>
						{sending.isPending
							? EMAIL_CODE_COPY.sending
							: fixedEmail
								? EMAIL_CODE_COPY.sendForReauth
								: EMAIL_CODE_COPY.send}
					</Button>
				</form>
			)}

			{error && (
				<p className="text-sm font-medium text-danger" role="alert">
					{error.message}
				</p>
			)}
		</div>
	)
}
