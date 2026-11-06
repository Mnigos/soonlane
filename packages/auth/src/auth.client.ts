import { createAuthClient } from 'better-auth/client'

/** Browser client for sign-in, sign-out and provider redirects; read the session through `identity.me`, not here. */
export const authClient = createAuthClient()

export interface GoogleSignInRedirects {
	callbackURL: string
	errorCallbackURL: string
}

export async function signInWithGoogle(redirects: GoogleSignInRedirects) {
	return await authClient.signIn.social({ provider: 'google', ...redirects })
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
