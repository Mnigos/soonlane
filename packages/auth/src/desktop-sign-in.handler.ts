import type { BetterAuthPlugin } from 'better-auth'
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

const CODE_LENGTH = 32
const CODE_TTL_MS = 2 * 60 * 1000
const CODE_IDENTIFIER_PREFIX = 'desktop-sign-in:'
const INVALID_CODE_MESSAGE =
	'This sign-in link expired or was already used. Start again from the desktop app.'

const storedCodeSchema = z.object({
	userId: z.string(),
	challenge: z.string(),
	// A code stored without an age never counts as a fresh session.
	sessionCreatedAt: z.coerce.date().catch(() => new Date(0)),
})

async function toCodeIdentifier(code: string) {
	return `${CODE_IDENTIFIER_PREFIX}${await toCodeChallenge(code)}`
}

/**
 * Hands a browser sign-in to the desktop app (PKCE S256). The signed-in
 * browser trades the app's challenge for a short-lived code, which travels to
 * the app's loopback address; only the app holds the verifier that turns the
 * code into a session of its own, returned as the signed token its main
 * process keeps.
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
				DESKTOP_TOKEN_PATH,
				{
					method: 'POST',
					body: z.object({
						code: z.string().regex(SIGN_IN_CODE_PATTERN),
						verifier: z.string().regex(CODE_CHALLENGE_PATTERN),
					}),
				},
				async ctx => {
					const { internalAdapter } = ctx.context
					// Consumed before the verifier is checked, so a wrong guess spends the code too.
					const stored = await internalAdapter.consumeVerificationValue(
						await toCodeIdentifier(ctx.body.code)
					)
					const pending = stored
						? storedCodeSchema.parse(JSON.parse(stored.value))
						: undefined
					const verified =
						pending?.challenge === (await toCodeChallenge(ctx.body.verifier))
					const user =
						pending && verified
							? await internalAdapter.findUserById(pending.userId)
							: null

					if (!(pending && user))
						throw new APIError('BAD_REQUEST', { message: INVALID_CODE_MESSAGE })

					// Keep the browser session's age, so a hand-off never yields a fresher session.
					const session = await internalAdapter.createSession(
						user.id,
						false,
						{ createdAt: pending.sessionCreatedAt },
						true
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
