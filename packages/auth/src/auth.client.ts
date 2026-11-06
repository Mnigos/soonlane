import { createAuthClient } from 'better-auth/client'

/** Browser client for sign-in, sign-out and provider redirects; read the session through `identity.me`, not here. */
export const authClient = createAuthClient()

export interface GoogleSignInRedirects {
	callbackURL: string
	errorCallbackURL: string
}

interface GoogleSignInOptions {
	loginHint?: string
	fresh?: boolean
}

const FORCED_GOOGLE_LOGIN_PARAMS = { prompt: 'login', max_age: '0' }

/** `loginHint` keeps a repeated sign-in on the same Google account; `fresh` asks Google for a new login, which Google may still skip after its own risk check. */
export async function signInWithGoogle(
	redirects: GoogleSignInRedirects,
	{ loginHint, fresh = false }: GoogleSignInOptions = {}
) {
	return await authClient.signIn.social({
		provider: 'google',
		...redirects,
		loginHint,
		additionalParams: fresh ? FORCED_GOOGLE_LOGIN_PARAMS : undefined,
	})
}

/** The signed-in browser's one-time code for the desktop app that sent this challenge. */
export async function createDesktopSignInCode(challenge: string) {
	return await authClient.$fetch<{ code: string }>('/desktop-sign-in/code', {
		method: 'POST',
		body: { challenge },
	})
}

/** Trades the code and the app's verifier for a session cookie on this origin. */
export async function exchangeDesktopSignInCode(
	code: string,
	verifier: string
) {
	return await authClient.$fetch<{ status: boolean }>(
		'/desktop-sign-in/exchange',
		{ method: 'POST', body: { code, verifier } }
	)
}
