import type { AuthContext, BetterAuthPlugin } from 'better-auth'
import {
	APIError,
	createAuthEndpoint,
	sessionMiddleware,
} from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import { generateRandomString, makeSignature } from 'better-auth/crypto'
import { z } from 'zod'
import { CODE_CHALLENGE_PATTERN } from './desktop-sign-in.constants'
import { toCodeChallenge } from './desktop-sign-in.helper'

const CODE_LENGTH = 32
const CODE_PATTERN = new RegExp(String.raw`^[\w-]{${CODE_LENGTH}}$`, 'u')
const CODE_TTL_MS = 2 * 60 * 1000
const CODE_IDENTIFIER_PREFIX = 'desktop-sign-in:'
/** Trades the code for a session cookie in the app's window. */
export const DESKTOP_EXCHANGE_PATH = '/desktop-sign-in/exchange'
/** Trades the code for a session token returned to the app's main process. */
export const DESKTOP_TOKEN_PATH = '/desktop-sign-in/token'
const INVALID_CODE_MESSAGE =
	'This sign-in link expired or was already used. Start again from the desktop app.'

const storedCodeSchema = z.object({
	userId: z.string(),
	challenge: z.string(),
	// A code stored without an age never counts as a fresh session.
	sessionCreatedAt: z.coerce.date().catch(() => new Date(0)),
})

const exchangeBodySchema = z.object({
	code: z.string().regex(CODE_PATTERN),
	verifier: z.string().regex(CODE_CHALLENGE_PATTERN),
})

async function toCodeIdentifier(code: string) {
	return `${CODE_IDENTIFIER_PREFIX}${await toCodeChallenge(code)}`
}

/** Spends the code and, when the verifier matches its challenge, starts a desktop session for the user who made it. */
async function startDesktopSession(
	adapter: AuthContext['internalAdapter'],
	{ code, verifier }: z.infer<typeof exchangeBodySchema>
) {
	// Consumed before the verifier is checked, so a wrong guess spends the code too.
	const stored = await adapter.consumeVerificationValue(
		await toCodeIdentifier(code)
	)
	const pending = stored
		? storedCodeSchema.parse(JSON.parse(stored.value))
		: undefined
	const verified = pending?.challenge === (await toCodeChallenge(verifier))
	const user =
		pending && verified ? await adapter.findUserById(pending.userId) : null

	if (!(pending && user))
		throw new APIError('BAD_REQUEST', { message: INVALID_CODE_MESSAGE })

	// Keep the browser session's age, so a hand-off never yields a fresher session.
	const session = await adapter.createSession(
		user.id,
		false,
		{ createdAt: pending.sessionCreatedAt },
		true
	)

	return { session, user }
}

/**
 * Hands a browser sign-in to the desktop app (PKCE S256). The signed-in
 * browser trades the app's challenge for a short-lived code, which travels
 * through the `soonlane://` link or the app's loopback address; only the app
 * holds the verifier that turns the code into a session of its own, as a
 * cookie in its window (`/exchange`) or as a bearer token its main process
 * keeps (`/token`).
 */
export function desktopSignIn() {
	return {
		id: 'desktop-sign-in',
		endpoints: {
			createDesktopSignInCode: createAuthEndpoint(
				'/desktop-sign-in/code',
				{
					method: 'POST',
					body: z.object({
						challenge: z.string().regex(CODE_CHALLENGE_PATTERN),
					}),
					use: [sessionMiddleware],
				},
				async ctx => {
					const code = generateRandomString(CODE_LENGTH)

					// Stored hashed: a leaked verification row cannot be replayed as a code.
					await ctx.context.internalAdapter.createVerificationValue({
						identifier: await toCodeIdentifier(code),
						value: JSON.stringify({
							userId: ctx.context.session.user.id,
							challenge: ctx.body.challenge,
							sessionCreatedAt: ctx.context.session.session.createdAt,
						}),
						expiresAt: new Date(Date.now() + CODE_TTL_MS),
					})

					return await ctx.json({ code })
				}
			),
			exchangeDesktopSignInCode: createAuthEndpoint(
				DESKTOP_EXCHANGE_PATH,
				{ method: 'POST', body: exchangeBodySchema },
				async ctx => {
					await setSessionCookie(
						ctx,
						await startDesktopSession(ctx.context.internalAdapter, ctx.body)
					)

					return await ctx.json({ status: true })
				}
			),
			exchangeDesktopSignInCodeForToken: createAuthEndpoint(
				DESKTOP_TOKEN_PATH,
				{ method: 'POST', body: exchangeBodySchema },
				async ctx => {
					const { session } = await startDesktopSession(
						ctx.context.internalAdapter,
						ctx.body
					)
					// Signed like the session cookie: the `bearer` plugin accepts only signed tokens.
					const signature = await makeSignature(
						session.token,
						ctx.context.secret
					)

					ctx.setHeader('cache-control', 'no-store')

					return await ctx.json({ token: `${session.token}.${signature}` })
				}
			),
		},
	} satisfies BetterAuthPlugin
}
