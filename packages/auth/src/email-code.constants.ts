/** Mails a sign-in code to an address; always answers success, so nobody learns whether the address has an account. */
export const EMAIL_CODE_SEND_PATH = '/email-otp/send-verification-otp'
/** Trades an address and its code for a session cookie; creates the account on the first sign-in. */
export const EMAIL_CODE_SIGN_IN_PATH = '/sign-in/email-otp'
export const EMAIL_CODE_LENGTH = 6
/** How long a code stays valid; a resend within it mails the same code. */
export const EMAIL_CODE_TTL_S = 10 * 60
/** The one answer to a code that does not work: wrong, spent after 3 attempts, expired or never sent. */
export const INVALID_EMAIL_CODE = 'INVALID_OTP'
/** The answer once an address got its hourly share of codes. */
export const TOO_MANY_CODES = 'TOO_MANY_CODES'
/** The error a Google sign-in returns with when its address belongs to an account Google cannot vouch for (not Gmail, not Workspace). */
export const GOOGLE_LINK_REFUSED = 'GOOGLE_LINK_REFUSED'

/** The ways a user can prove themselves again before deleting the account; a `SESSION_EXPIRED` refusal of `/delete-user` lists the ones this server offers this user in `reauth`. */
export type ReauthMethod = 'email' | 'google'
