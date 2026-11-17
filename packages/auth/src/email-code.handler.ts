import { rateLimit } from '@soonlane/db'
import type { BetterAuthPlugin, GenericEndpointContext } from 'better-auth'
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api'
import { makeSignature } from 'better-auth/crypto'
import { emailOTP } from 'better-auth/plugins'
import { sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { z } from 'zod'
import { normalizeEmail } from './auth-policy.helper'
import {
	EMAIL_CODE_LENGTH,
	EMAIL_CODE_SEND_PATH,
	EMAIL_CODE_SIGN_IN_PATH,
	EMAIL_CODE_TTL_S,
	INVALID_EMAIL_CODE,
	TOO_MANY_CODES,
} from './email-code.constants'

/** A sign-in code to mail; `to` is the address as the user typed it, trimmed and lowercased. */
export interface SignInCodeMail {
	to: string
	code: string
}

export interface EmailCodeOptions {
	/** Hands the mail over and returns without waiting for delivery, so the answer takes as long whether or not a mail goes out; it never rejects, and a failed send is the caller's to log. */
	send: (mail: SignInCodeMail) => Promise<void>
}

interface EmailCodeContext {
	database: NodePgDatabase
	secret: string
	allowedEmails: readonly string[]
	emailCode: EmailCodeOptions
}

/** Better Auth prunes `rate_limit` rows older than its longest rule's window, one hour through `/delete-user`'s rule; a shorter longest window would drop these counters early. */
const ADDRESS_WINDOW_MS = 60 * 60 * 1000
const MAILS_PER_ADDRESS = 5
const ATTEMPTS_PER_CODE = 3
const FRESH_EMAIL_CODE_MS = 5 * 60 * 1000
const CLOCK_SKEW_MS = 60 * 1000

/** The emailOTP endpoints Soonlane does not use: verification, password reset and email change would each give another way into an account or change its address. */
export const UNUSED_EMAIL_CODE_PATHS = [
	'/email-otp/check-verification-otp',
	'/email-otp/verify-email',
	'/email-otp/request-password-reset',
	'/email-otp/reset-password',
	'/forget-password/email-otp',
	'/email-otp/request-email-change',
	'/email-otp/change-email',
]

/** Better Auth's answers to a code that does not work; each would tell a member's address from a stranger's on a closed server. */
const CODE_ERRORS = new Set<unknown>([
	'INVALID_OTP',
	'OTP_EXPIRED',
	'TOO_MANY_ATTEMPTS',
])

/** RFC 5321's limit on an address's length. */
const MAX_EMAIL_LENGTH = 254
const sendBodySchema = z.strictObject({
	email: z
		.string()
		.transform(normalizeEmail)
		.pipe(z.email().max(MAX_EMAIL_LENGTH)),
	type: z.literal('sign-in'),
})
const signInBodySchema = z.strictObject({ email: z.string(), otp: z.string() })
const emailCodeAtSchema = z.object({
	emailCodeAt: z.union([
		z.date(),
		z.iso.datetime().transform(value => new Date(value)),
	]),
})

/** When an email code started this session, or the browser session it was handed off from (a stored hand-off code holds it as an ISO string); `null` for any other session. */
export function readEmailCodeAt(session: unknown): Date | null {
	const parsed = emailCodeAtSchema.safeParse(session)

	return parsed.success ? parsed.data.emailCodeAt : null
}

/** A session that an email code started at most five minutes ago may delete its account. */
export function isFreshEmailCode(session: unknown) {
	const emailCodeAt = readEmailCodeAt(session)

	if (!emailCodeAt) return false

	const ageMs = Date.now() - emailCodeAt.getTime()

	return ageMs >= -CLOCK_SKEW_MS && ageMs <= FRESH_EMAIL_CODE_MS
}

/** Counts one more mail to the address in a one-hour window, atomically, and answers how many the window holds now. The key is keyed with the auth secret, so `rate_limit` holds no address. */
async function countMailTo(
	{ database, secret }: EmailCodeContext,
	email: string
) {
	const key = `email-code:${await makeSignature(email, secret)}`
	const now = Date.now()
	const expired = sql`${rateLimit.lastRequest} < ${now - ADDRESS_WINDOW_MS}`
	const [row] = await database
		.insert(rateLimit)
		.values({ key, count: 1, lastRequest: now })
		.onConflictDoUpdate({
			target: rateLimit.key,
			set: {
				count: sql`case when ${expired} then 1 else ${rateLimit.count} + 1 end`,
				lastRequest: sql`case when ${expired} then ${now} else ${rateLimit.lastRequest} end`,
			},
		})
		.returning({ count: rateLimit.count })

	return row?.count ?? 0
}

/** On a closed server, an address that is neither listed nor an existing user gets no mail; its stored code reaches nobody, and `canSignUp` would refuse it anyway. The user is looked up for every address first, so the time taken says nothing either. */
async function isStranger(
	{ allowedEmails }: EmailCodeContext,
	ctx: GenericEndpointContext | undefined,
	email: string
) {
	const existing = await ctx?.context.internalAdapter.findUserByEmail(email)

	return allowedEmails.length > 0 && !allowedEmails.includes(email) && !existing
}

function invalidBody(message: string) {
	return new APIError('BAD_REQUEST', { message })
}

/** Guards Better Auth's emailOTP endpoints: exact bodies, normalized addresses and a cap per address; a code that does not work gets one answer, and the sign-in answer carries no session token, which the cookie already holds. */
function emailCodeGuard(context: EmailCodeContext) {
	return {
		id: 'email-code-guard',
		hooks: {
			before: [
				{
					matcher: ({ path }) => path === EMAIL_CODE_SEND_PATH,
					handler: createAuthMiddleware(async ctx => {
						const body = sendBodySchema.safeParse(ctx.body)

						if (!body.success)
							throw invalidBody('Send an email address and type sign-in.')

						const { email } = body.data

						if ((await countMailTo(context, email)) > MAILS_PER_ADDRESS)
							throw new APIError('TOO_MANY_REQUESTS', {
								code: TOO_MANY_CODES,
								message:
									'Too many code requests for this address. Try again later.',
							})

						return { context: { body: { email, type: 'sign-in' } } }
					}),
				},
				{
					matcher: ({ path }) => path === EMAIL_CODE_SIGN_IN_PATH,
					handler: createAuthMiddleware(async ctx => {
						const body = signInBodySchema.safeParse(ctx.body)

						if (!body.success)
							throw invalidBody('Send an email address and its code.')

						return {
							context: {
								body: {
									email: normalizeEmail(body.data.email),
									otp: body.data.otp.trim(),
								},
							},
						}
					}),
				},
			],
			after: [
				{
					matcher: ({ path }) => path === EMAIL_CODE_SIGN_IN_PATH,
					handler: createAuthMiddleware(async ctx => {
						ctx.setHeader('cache-control', 'no-store')

						const { returned } = ctx.context

						// One answer over HTTP for a wrong, spent, expired or never-sent code, so a closed server's skipped stranger looks like anyone else; a Response keeps its own status, which a thrown error here would not. A server-side `auth.api` call gets this Response back instead of a thrown error.
						if (isAPIError(returned) && CODE_ERRORS.has(returned.body?.code))
							return Response.json(
								{
									code: INVALID_EMAIL_CODE,
									message: 'This code is wrong or has expired.',
								},
								{ status: 400, headers: { 'cache-control': 'no-store' } }
							)
						// Without the session token Better Auth adds to the body; the cookie holds it.
						return typeof returned === 'object' &&
							returned !== null &&
							!isAPIError(returned) &&
							'user' in returned
							? { user: returned.user }
							: returned
					}),
				},
			],
		},
	} satisfies BetterAuthPlugin
}

/**
 * Sign-in with a six-digit code mailed to the address: the first sign-in
 * creates the account, a later one signs into the user with that address,
 * Google users included. Codes last ten minutes and are stored encrypted, so a
 * resend within that time mails the same code and keeps its three attempts.
 */
export function emailCodeSignIn(context: EmailCodeContext) {
	return [
		emailCodeGuard(context),
		emailOTP({
			otpLength: EMAIL_CODE_LENGTH,
			expiresIn: EMAIL_CODE_TTL_S,
			allowedAttempts: ATTEMPTS_PER_CODE,
			storeOTP: 'encrypted',
			resendStrategy: 'reuse',
			// Decided here, after the plugin stored the code, so a stranger costs the same work as anyone and the answer cannot tell them apart.
			sendVerificationOTP: async ({ email, otp }, ctx) => {
				if (!(await isStranger(context, ctx, email)))
					await context.emailCode.send({ to: email, code: otp })
			},
		}),
	]
}
