import type { ReauthMethod } from './email-code.constants'

/** The `reauth` of a `SESSION_EXPIRED` refusal of `/delete-user`. Only `email` and `google` count; an answer from an API that predates `reauth` offers Google, as it always did. */
export function readReauth(error: object): ReauthMethod[] {
	const reauth = 'reauth' in error ? error.reauth : undefined

	if (!Array.isArray(reauth)) return ['google']

	return reauth.filter(
		(method): method is ReauthMethod =>
			method === 'email' || method === 'google'
	)
}
