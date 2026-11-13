import {
	CODE_CHALLENGE_PARAM,
	DESKTOP_SIGN_IN_PATH,
	LOOPBACK_CALLBACK_PATH,
	LOOPBACK_PORT_PARAM,
	SIGN_IN_CODE_PARAM,
	SIGN_IN_CODE_PATTERN,
} from '@soonlane/auth'

interface BrowserSignIn {
	challenge: string
	/** The loopback listener's port, where the browser hands the code back. */
	port: number
}

/** The browser's sign-in page for this challenge. */
export function getBrowserSignInUrl(
	appUrl: URL,
	{ challenge, port }: BrowserSignIn
) {
	const url = new URL(DESKTOP_SIGN_IN_PATH, appUrl)

	url.searchParams.set(CODE_CHALLENGE_PARAM, challenge)
	url.searchParams.set(LOOPBACK_PORT_PARAM, String(port))

	return url
}

/**
 * The code of a `GET /callback?code=…` the browser sent to the listener; any
 * other request carries none, so a page that guesses the port cannot end the
 * sign-in with junk.
 */
export function readCallbackCode(request: Request) {
	const url = new URL(request.url)
	const code = url.searchParams.get(SIGN_IN_CODE_PARAM)

	return request.method === 'GET' &&
		url.pathname === LOOPBACK_CALLBACK_PATH &&
		code !== null &&
		SIGN_IN_CODE_PATTERN.test(code)
		? code
		: undefined
}
