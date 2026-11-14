/** The desktop app's URL scheme; the browser hands a sign-in back through `soonlane://sign-in?code=…`. */
export const DESKTOP_URL_SCHEME = 'soonlane'
export const DESKTOP_SIGN_IN_LINK_HOST = 'sign-in'

/** The browser page that signs the user in for the desktop app; the app's window never loads it. */
export const DESKTOP_SIGN_IN_PATH = '/desktop/sign-in'
/** The page the app's window loads to trade the code and its verifier for a session. */
export const DESKTOP_CALLBACK_PATH = '/desktop/callback'
export const CODE_CHALLENGE_PARAM = 'challenge'
/** Asks `/desktop/sign-in` to go through Google even when the browser is signed in, so the app gets a fresh session. */
export const FRESH_SIGN_IN_PARAM = 'fresh'
export const SIGN_IN_CODE_PARAM = 'code'
export const CODE_VERIFIER_PARAM = 'verifier'

/** 32 bytes in base64url: a challenge from `toCodeChallenge`, and a verifier from `createCodeVerifier`. */
export const CODE_CHALLENGE_PATTERN = /^[\w-]{43}$/u
/** The one-time code `/desktop-sign-in/code` returns: 32 characters of Better Auth's `generateRandomString`. */
export const SIGN_IN_CODE_PATTERN = /^[\w-]{32}$/u

/**
 * The port the desktop app listens on for the sign-in code (RFC 8252). With it,
 * `/desktop/sign-in` hands the code to `http://127.0.0.1:<port>/callback?code=…`
 * instead of a `soonlane://` link.
 */
export const LOOPBACK_PORT_PARAM = 'port'
/** A literal address, never `localhost`, which a hosts file or DNS could point elsewhere. */
export const LOOPBACK_HOST = '127.0.0.1'
export const LOOPBACK_CALLBACK_PATH = '/callback'

/**
 * The `Origin` the desktop app's bundled page (Electrobun's `views://app`) sends.
 * Any Electrobun app with a view of that name sends it too, so it only selects
 * the API's CORS answer for bearer requests and never joins `TRUSTED_ORIGINS`.
 */
export const DESKTOP_PAGE_ORIGIN = 'views://app'
