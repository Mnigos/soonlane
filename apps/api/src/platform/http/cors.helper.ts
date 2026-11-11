import { type Context, Effect } from 'effect'

type RequestHandler = (request: Request) => Promise<Response>

/** Chrome caps a cached preflight at two hours; Firefox keeps it up to a day. */
const PREFLIGHT_MAX_AGE_S = 7200
/** The browser's oRPC link and Better Auth client send only `content-type` beyond the safelisted headers. */
const PREFLIGHT_HEADERS = {
	'access-control-allow-methods': 'GET, POST',
	'access-control-allow-headers': 'content-type',
	'access-control-max-age': String(PREFLIGHT_MAX_AGE_S),
}

/** A thrown failure becomes an empty 500 logged by name only, so it still carries the CORS headers. */
async function handleOrFail(
	context: Context.Context<never>,
	handle: RequestHandler,
	request: Request
) {
	try {
		return await handle(request)
	} catch (error) {
		Effect.runSyncWith(context)(
			Effect.logError(
				'CORS-wrapped request failed',
				error instanceof Error ? error.name : typeof error
			)
		)

		return new Response(null, { status: 500 })
	}
}

function forbidden() {
	return new Response(null, { status: 403, headers: { vary: 'Origin' } })
}

/**
 * CORS for the browser's direct calls: only an exact origin from `TRUSTED_ORIGINS`, with credentials.
 * Answers every preflight itself and refuses any other `Origin` with 403, including other `soonlane.com`
 * hosts and the API's own. A request without `Origin` (SSR, Google's redirect back) goes on to the
 * handler, whose own origin checks stay on; a provider that returned with a `form_post` would carry
 * Google's origin and be refused.
 */
export function withCors(
	context: Context.Context<never>,
	trustedOrigins: readonly string[],
	handle: RequestHandler
) {
	return async (request: Request) => {
		const origin = request.headers.get('origin')
		const isPreflight = request.method === 'OPTIONS'

		if (origin === null && !isPreflight) return await handle(request)
		if (origin === null || !trustedOrigins.includes(origin)) return forbidden()

		const corsHeaders = {
			'access-control-allow-origin': origin,
			'access-control-allow-credentials': 'true',
		}

		if (isPreflight)
			return new Response(null, {
				status: 204,
				headers: { ...corsHeaders, ...PREFLIGHT_HEADERS, vary: 'Origin' },
			})

		const response = await handleOrFail(context, handle, request)
		// A fresh response: one from a redirect helper can have immutable headers.
		const answer = new Response(response.body, response)

		for (const [name, value] of Object.entries(corsHeaders))
			answer.headers.set(name, value)
		answer.headers.append('vary', 'Origin')

		return answer
	}
}
