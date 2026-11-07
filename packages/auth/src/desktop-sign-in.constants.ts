export const DESKTOP_URL_SCHEME = 'soonlane'
export const DESKTOP_SIGN_IN_LINK_HOST = 'sign-in'

/** Opened in the system browser, never in the app's window. */
export const DESKTOP_SIGN_IN_PATH = '/desktop/sign-in'
export const DESKTOP_CALLBACK_PATH = '/desktop/callback'
export const CODE_CHALLENGE_PARAM = 'challenge'
/** Forces Google even when the browser is signed in, so the app gets a fresh session. */
export const FRESH_SIGN_IN_PARAM = 'fresh'
export const SIGN_IN_CODE_PARAM = 'code'
export const CODE_VERIFIER_PARAM = 'verifier'

/** 32 bytes in base64url. */
export const CODE_CHALLENGE_PATTERN = /^[\w-]{43}$/u
