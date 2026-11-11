/** A non-HttpOnly `1` while the browser holds a session, so static pages can show "Open app"; it carries no user data and shares the environment's cookie prefix. */
export function getSignedInHintCookie(cookiePrefix: string) {
	return `${cookiePrefix}.signed_in`
}
