import {
	CODE_CHALLENGE_PARAM,
	CODE_VERIFIER_PARAM,
	DESKTOP_CALLBACK_PATH,
	DESKTOP_SIGN_IN_LINK_HOST,
	DESKTOP_SIGN_IN_PATH,
	DESKTOP_URL_SCHEME,
	FRESH_SIGN_IN_PARAM,
	SIGN_IN_CODE_PARAM,
} from '@soonlane/auth'

export function isSignInStart(href: string, appUrl: URL) {
	const url = URL.parse(href)

	return url?.origin === appUrl.origin && url.pathname === DESKTOP_SIGN_IN_PATH
}

export function readSignInCode(href: string) {
	const url = URL.parse(href)

	return url?.protocol === `${DESKTOP_URL_SCHEME}:` &&
		url.host === DESKTOP_SIGN_IN_LINK_HOST
		? (url.searchParams.get(SIGN_IN_CODE_PARAM) ?? undefined)
		: undefined
}

/** The browser's sign-in page for this challenge; a fresh sign-in the window asked for (account deletion) carries over. */
export function getBrowserSignInUrl(
	appUrl: URL,
	challenge: string,
	requestedHref: string
) {
	const url = new URL(DESKTOP_SIGN_IN_PATH, appUrl)
	const fresh = URL.parse(requestedHref)?.searchParams.get(FRESH_SIGN_IN_PARAM)

	url.searchParams.set(CODE_CHALLENGE_PARAM, challenge)
	if (fresh) url.searchParams.set(FRESH_SIGN_IN_PARAM, fresh)

	return url
}

// The fragment keeps the code and the verifier out of requests and server logs.
export function getCallbackUrl(
	appUrl: URL,
	code: string,
	verifier: string | undefined
) {
	const url = new URL(DESKTOP_CALLBACK_PATH, appUrl)

	if (verifier)
		url.hash = new URLSearchParams({
			[SIGN_IN_CODE_PARAM]: code,
			[CODE_VERIFIER_PARAM]: verifier,
		}).toString()

	return url
}
