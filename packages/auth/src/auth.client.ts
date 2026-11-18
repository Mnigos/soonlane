import { createAuthClient } from 'better-auth/client'
import {
	EMAIL_CODE_SEND_PATH,
	EMAIL_CODE_SIGN_IN_PATH,
} from './email-code.constants'
import { TODOIST_IMPORT_PATH, TODOIST_PROVIDER_ID } from './todoist.constants'

/** Browser client for sign-in, sign-out and provider redirects; read the session through `identity.me`, not here. `VITE_API_URL` is the API's origin; empty, Better Auth falls back to the page's. */
export const authClient = createAuthClient({
	baseURL: import.meta.env.VITE_API_URL,
	fetchOptions: { credentials: 'include' },
})

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
		callbackURL: new URL(redirects.callbackURL, window.location.origin).href,
		errorCallbackURL: new URL(
			redirects.errorCallbackURL,
			window.location.origin
		).href,
		loginHint,
		additionalParams: fresh ? FORCED_GOOGLE_LOGIN_PARAMS : undefined,
	})
}

/** Sends the signed-in browser to Todoist's consent screen; Todoist returns it to the import page, with `?error=` when nothing was linked. */
export async function linkTodoist() {
	const importPage = new URL(TODOIST_IMPORT_PATH, window.location.origin).href

	return await authClient.linkSocial({
		provider: TODOIST_PROVIDER_ID,
		callbackURL: importPage,
		errorCallbackURL: importPage,
	})
}

/** The signed-in browser's one-time code for the desktop app that sent this challenge. */
export async function createDesktopSignInCode(challenge: string) {
	return await authClient.$fetch<{ code: string }>('/desktop-sign-in/code', {
		method: 'POST',
		body: { challenge },
	})
}

/** Mails a six-digit sign-in code to the address; the answer is the same whether or not it has an account. */
export async function sendEmailCode(email: string) {
	return await authClient.$fetch<{ success: boolean }>(EMAIL_CODE_SEND_PATH, {
		method: 'POST',
		body: { email, type: 'sign-in' },
	})
}

/** Signs this browser in with the code mailed to the address, creating the account on the first sign-in. */
export async function signInWithEmailCode(email: string, code: string) {
	return await authClient.$fetch(EMAIL_CODE_SIGN_IN_PATH, {
		method: 'POST',
		body: { email, otp: code },
	})
}
