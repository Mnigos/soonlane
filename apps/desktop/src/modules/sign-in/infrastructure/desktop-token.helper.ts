import { AUTH_BASE_PATH, DESKTOP_TOKEN_PATH } from '@soonlane/auth'
import { Effect, Schema } from 'effect'

const EXCHANGE_TIMEOUT = '15 seconds'
/** Shorter than the page's 15-second RPC wait, so a sign-out always answers it. */
const REVOKE_TIMEOUT = '5 seconds'
const decodeTokenResponse = Schema.decodeUnknownEffect(
	Schema.Struct({ token: Schema.String })
)

interface AuthRequest {
	body: unknown
	headers?: Record<string, string>
	signal: AbortSignal
}

async function postToAuth(
	apiUrl: URL,
	path: string,
	{ body, headers = {}, signal }: AuthRequest
) {
	const response = await fetch(new URL(`${AUTH_BASE_PATH}${path}`, apiUrl), {
		method: 'POST',
		headers: { 'content-type': 'application/json', ...headers },
		body: JSON.stringify(body),
		signal,
	})

	// Only the status: an error body could echo the request.
	if (!response.ok)
		throw new Error(`Auth request failed with ${response.status}`)

	return response
}

/** Trades the sign-in code and its verifier for a desktop token. */
export function exchangeSignInCode(
	apiUrl: URL,
	code: string,
	verifier: string
) {
	return Effect.tryPromise(async signal => {
		const response = await postToAuth(apiUrl, DESKTOP_TOKEN_PATH, {
			body: { code, verifier },
			signal,
		})

		return (await response.json()) as unknown
	}).pipe(
		Effect.timeout(EXCHANGE_TIMEOUT),
		Effect.flatMap(decodeTokenResponse),
		Effect.map(({ token }) => token)
	)
}

/** Ends the desktop session on the server, so the token stops working even where it was copied. */
export function revokeToken(apiUrl: URL, token: string) {
	return Effect.tryPromise(
		async signal =>
			await postToAuth(apiUrl, '/sign-out', {
				body: {},
				headers: { authorization: `Bearer ${token}` },
				signal,
			})
	).pipe(Effect.timeout(REVOKE_TIMEOUT), Effect.asVoid)
}
