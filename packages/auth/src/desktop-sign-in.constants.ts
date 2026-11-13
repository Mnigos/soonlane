/** Where Better Auth's endpoints live on the API. */
export const AUTH_BASE_PATH = '/api/auth'
/** The browser page that signs the user in for the desktop app; the app's window never loads it. */
export const DESKTOP_SIGN_IN_PATH = '/desktop/sign-in'
export const CODE_CHALLENGE_PARAM = 'challenge'
/** Asks `/desktop/sign-in` to go through Google even when the browser is signed in, so the app gets a fresh session. */
export const FRESH_SIGN_IN_PARAM = 'fresh'
export const SIGN_IN_CODE_PARAM = 'code'

/** 32 bytes in base64url: a challenge from `toCodeChallenge`, and a verifier from `createCodeVerifier`. */
export const CODE_CHALLENGE_PATTERN = /^[\w-]{43}$/u
/** A one-time sign-in code: 32 characters from Better Auth's `generateRandomString`. */
export const SIGN_IN_CODE_PATTERN = /^[\w-]{32}$/u

/**
 * The port the desktop app listens on for the sign-in code (RFC 8252):
 * `/desktop/sign-in` hands the code to `http://127.0.0.1:<port>/callback?code=…`.
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
/** Where the desktop app trades the sign-in code and its verifier for a desktop token. */
export const DESKTOP_TOKEN_PATH = '/desktop-sign-in/token'
