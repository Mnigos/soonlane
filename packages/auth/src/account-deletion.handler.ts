import type { GenericEndpointContext } from 'better-auth'
import { APIError, getSessionFromCtx } from 'better-auth/api'
import { z } from 'zod'
import { GOOGLE_LOGIN_NOT_RENEWED } from './account-deletion.constants'
import type { AuthLogger, AuthLogLevel } from './better-auth.config'
import type { ReauthMethod } from './email-code.constants'
import { isFreshEmailCode } from './email-code.handler'
import { parseJson } from './utils/json.util'

/** Asks Google for `auth_time` in the ID token; Google adds it only while "Session age claims" is on for the OAuth client's project. */
export const GOOGLE_AUTH_TIME_CLAIMS = JSON.stringify({
	id_token: { auth_time: { essential: true } },
})

const FRESH_GOOGLE_LOGIN_S = 5 * 60
/** How far Google's clock and the API's may disagree. */
const CLOCK_SKEW_S = 60

const idTokenPayloadSchema = z.object({
	auth_time: z.number().int().nonnegative(),
})

/** Why a deletion was refused, for the log (never the token), and the `reason` the `SESSION_EXPIRED` answer carries, if any. */
interface DeletionRefusal {
	level: AuthLogLevel
	message: string
	reason?: typeof GOOGLE_LOGIN_NOT_RENEWED
}

/** Every before hook sees the request's own headers, so a session lookup in one misses a bearer session. */
export function isBearerRequest(ctx: GenericEndpointContext) {
	return (
		ctx.request?.headers.has('authorization') === true ||
		ctx.headers?.has('authorization') === true
	)
}

/** The latest `auth_time` among the ID tokens; no signature check, as Better Auth stores only ID tokens it got from Google's token endpoint and Google ID-token sign-in is off. */
function readNewestAuthTime(idTokens: readonly (string | null | undefined)[]) {
	const authTimes = idTokens.flatMap(idToken => {
		const payload = idToken?.split('.')[1]
		const claims = idTokenPayloadSchema.safeParse(
			payload
				? parseJson(Buffer.from(payload, 'base64url').toString())
				: undefined
		)

		return claims.success ? [claims.data.auth_time] : []
	})

	return authTimes.length > 0 ? Math.max(...authTimes) : undefined
}

/**
 * Why a session may not delete its account, or undefined when it may: the
 * user's last Google login (the newest `auth_time` of the ID tokens Better
 * Auth stored on the user's Google accounts) is at most five minutes old and
 * the session started after it. A hand-off session keeps its browser
 * session's start, so it passes only when that browser signed in after the
 * login. An old login whose session started later came through a Google
 * sign-in that kept that login: reason `GOOGLE_LOGIN_NOT_RENEWED`.
 */
function findDeletionRefusal(
	idTokens: readonly (string | null | undefined)[],
	sessionCreatedAt: Date
): DeletionRefusal | undefined {
	const authTime = readNewestAuthTime(idTokens)

	if (authTime === undefined)
		return { level: 'warn', message: 'the Google ID token has no auth_time' }

	const ageS = Math.round(Date.now() / 1000 - authTime)
	const sessionLeadS = Math.round(authTime - sessionCreatedAt.getTime() / 1000)

	if (ageS < -CLOCK_SKEW_S)
		return { level: 'warn', message: `auth_time is ${-ageS} s in the future` }
	if (ageS > FRESH_GOOGLE_LOGIN_S && sessionLeadS < -CLOCK_SKEW_S)
		return {
			level: 'info',
			message: `the Google login is ${ageS} s old and the session started ${-sessionLeadS} s after it`,
			reason: GOOGLE_LOGIN_NOT_RENEWED,
		}
	if (ageS > FRESH_GOOGLE_LOGIN_S)
		return { level: 'info', message: `the Google login is ${ageS} s old` }
	if (sessionLeadS > CLOCK_SKEW_S)
		return {
			level: 'info',
			message: `the session started ${sessionLeadS} s before the Google login, ${ageS} s ago`,
		}

	return undefined
}

/** The sign-in methods this server offers, which decide how a user proves themselves again before deleting the account. */
export interface DeletionMethods {
	google: boolean
	emailCode: boolean
}

const REAUTH_MESSAGES: Record<string, string> = {
	'email,google':
		'Sign in again with an email code or Google to delete your account.',
	email: 'Sign in again with an email code to delete your account.',
	google: 'Sign in again with Google to delete your account.',
	'': "This account can't be deleted because no sign-in method is configured.",
}

/**
 * The before hook's check on `/delete-user`: lets it through for a session
 * that an email code started at most five minutes ago (or a hand-off from
 * one), or that started with a Google login at most five minutes old, and
 * otherwise answers `SESSION_EXPIRED` with `reauth`, the methods this user can
 * prove themselves with: an email code for everyone while email sign-in is
 * on, Google for a user with a Google account while Google sign-in is on.
 * With reason `GOOGLE_LOGIN_NOT_RENEWED`, a client offering Google first asks
 * the user to sign out of Google. Bearer requests are refused, as their
 * session is invisible here; the desktop app deletes nothing.
 */
export async function refuseStaleDeletion(
	ctx: GenericEndpointContext,
	methods: DeletionMethods,
	log: AuthLogger
) {
	if (isBearerRequest(ctx))
		throw new APIError('FORBIDDEN', {
			message: 'Delete the account from the browser or the phone app.',
		})

	const signedIn = await getSessionFromCtx(ctx, { disableCookieCache: true })

	if (!signedIn) throw new APIError('UNAUTHORIZED')
	if (methods.emailCode && isFreshEmailCode(signedIn.session)) return

	const accounts = await ctx.context.internalAdapter.findAccounts(
		signedIn.user.id
	)
	const googleIdTokens = accounts
		.filter(({ providerId }) => providerId === 'google')
		.map(({ idToken }) => idToken)
	const offersGoogle = methods.google && googleIdTokens.length > 0
	const refusal = offersGoogle
		? findDeletionRefusal(googleIdTokens, new Date(signedIn.session.createdAt))
		: { level: 'info' as const, message: 'no fresh email code' }

	if (!refusal) return

	const reauth = [
		...(methods.emailCode ? ['email' as const] : []),
		...(offersGoogle ? ['google' as const] : []),
	] satisfies ReauthMethod[]

	log(refusal.level, `[Account deletion] Refused: ${refusal.message}.`)
	throw new APIError('BAD_REQUEST', {
		code: 'SESSION_EXPIRED',
		message: REAUTH_MESSAGES[reauth.join(',')],
		reason: refusal.reason,
		reauth,
	})
}
