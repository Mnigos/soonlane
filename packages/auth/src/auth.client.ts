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
