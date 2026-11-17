/** The `reason` a `SESSION_EXPIRED` refusal of `/delete-user` carries when the session came from a Google sign-in that kept an older Google login: another sign-in in the same browser would not renew it until the user signs out of Google. The code stays `SESSION_EXPIRED`, so builds that predate `reason` still offer a sign-in. */
export const GOOGLE_LOGIN_NOT_RENEWED = 'GOOGLE_LOGIN_NOT_RENEWED'
