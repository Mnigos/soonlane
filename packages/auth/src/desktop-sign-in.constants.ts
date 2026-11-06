/** The desktop app's URL scheme; the browser hands a sign-in back through `soonlane://sign-in?code=…`. */
export const DESKTOP_URL_SCHEME = 'soonlane'
export const DESKTOP_SIGN_IN_LINK_HOST = 'sign-in'

/** The browser page that signs the owner in for the desktop app; the app's window never loads it. */
export const DESKTOP_SIGN_IN_PATH = '/desktop/sign-in'
/** The page the app's window loads to trade the code and its verifier for a session. */
export const DESKTOP_CALLBACK_PATH = '/desktop/callback'
export const CODE_CHALLENGE_PARAM = 'challenge'
export const SIGN_IN_CODE_PARAM = 'code'
export const CODE_VERIFIER_PARAM = 'verifier'

/** 32 bytes in base64url: a challenge from `toCodeChallenge`, and a verifier from `createCodeVerifier`. */
export const CODE_CHALLENGE_PATTERN = /^[\w-]{43}$/u
