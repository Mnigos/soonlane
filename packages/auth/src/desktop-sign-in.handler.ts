import type { AuthContext, BetterAuthPlugin } from 'better-auth'
import {
	APIError,
	createAuthEndpoint,
	sessionMiddleware,
} from 'better-auth/api'
import { generateRandomString, makeSignature } from 'better-auth/crypto'
import { z } from 'zod'
import {
	CODE_CHALLENGE_PATTERN,
	DESKTOP_TOKEN_PATH,
	SIGN_IN_CODE_PATTERN,
} from './desktop-sign-in.constants'
import { toCodeChallenge } from './desktop-sign-in.helper'
import { readEmailCodeAt } from './email-code.handler'

const CODE_LENGTH = 32
const CODE_TTL_MS = 2 * 60 * 1000
const CODE_IDENTIFIER_PREFIX = 'desktop-sign-in:'
const INVALID_CODE_MESSAGE =
	'This sign-in link expired or was already used. Start again from the desktop app.'

const storedCodeSchema = z.looseObject({
	userId: z.string(),
	challenge: z.string(),
	// A code stored without an age never counts as a fresh session.
	sessionCreatedAt: z.coerce.date().catch(() => new Date(0)),
})

/** What an app sends to trade its code: the code and the verifier of the challenge it was minted for. */
export const exchangeBodySchema = z.object({
	code: z.string().regex(SIGN_IN_CODE_PATTERN),
	verifier: z.string().regex(CODE_CHALLENGE_PATTERN),
})

async function toCodeIdentifier(code: string) {
	return `${CODE_IDENTIFIER_PREFIX}${await toCodeChallenge(code)}`
}

/**
 * Spends the code and, when the verifier matches its challenge, starts a
 * session of its own for the user who made it, as old as the browser session
 * that minted the code. The one check every code exchange runs, the desktop
 * app's token and the Android app's cookie alike.
 */
export async function startHandOffSession(
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

	// Keep the browser session's age and email proof, so a hand-off never yields a fresher session.
	const session = await adapter.createSession(
		user.id,
		false,
		{
			createdAt: pending.sessionCreatedAt,
			emailCodeAt: readEmailCodeAt(pending),
		},
		true
	)

	return { session, user }
}

/**
 * Hands a browser sign-in to the desktop app (PKCE S256). The signed-in
 * browser trades the app's challenge for a short-lived code, which travels to
 * the app's loopback address; only the app holds the verifier that turns the
 * code into a session of its own, returned as the signed token its main
 * process keeps. The Android app's codes come from the same `/code`
 * (`androidSignIn`).
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
					const { session } = ctx.context.session

					// Stored hashed: a leaked verification row cannot be replayed as a code.
					await ctx.context.internalAdapter.createVerificationValue({
						identifier: await toCodeIdentifier(code),
						value: JSON.stringify({
							userId: ctx.context.session.user.id,
							challenge: ctx.body.challenge,
							sessionCreatedAt: session.createdAt,
							emailCodeAt: readEmailCodeAt(session),
						}),
						expiresAt: new Date(Date.now() + CODE_TTL_MS),
					})

					return await ctx.json({ code })
				}
			),
			exchangeDesktopSignInCode: createAuthEndpoint(
				DESKTOP_TOKEN_PATH,
				{ method: 'POST', body: exchangeBodySchema },
				async ctx => {
					const { session } = await startHandOffSession(
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
