import { DESKTOP_PAGE_ORIGIN } from '@soonlane/auth'
import { type Context, Effect } from 'effect'

type RequestHandler = (request: Request) => Promise<Response>

/** Chrome caps a cached preflight at two hours; Firefox keeps it up to a day. */
const PREFLIGHT_MAX_AGE_S = 7200
const PREFLIGHT_HEADERS = {
	'access-control-allow-methods': 'GET, POST',
	'access-control-max-age': String(PREFLIGHT_MAX_AGE_S),
}

interface CorsRule {
	/** Without credentials the response also loses any `Set-Cookie`, so the caller never stores a cookie. */
	credentials: boolean
	allowedHeaders: string
}

/**
 * The CORS answer for an origin, or `undefined` to refuse it. A web origin from
 * `TRUSTED_ORIGINS` gets credentials and only `content-type`, all the browser's
 * oRPC link and Better Auth client send beyond the safelisted headers. The
 * desktop app's bundled page gets no credentials and may send `authorization`
 * for its bearer token; a refreshed session's cookie never reaches its webview,
 * where the API would refuse it on the next request.
 */
function corsRuleFor(
	origin: string,
	trustedOrigins: readonly string[]
): CorsRule | undefined {
	if (trustedOrigins.includes(origin))
		return { credentials: true, allowedHeaders: 'content-type' }
	if (origin === DESKTOP_PAGE_ORIGIN)
		return {
			credentials: false,
			allowedHeaders: 'authorization, content-type',
		}

	return undefined
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
 * CORS for the browser's direct calls: an exact origin from `TRUSTED_ORIGINS` with credentials, and the
 * desktop app's bundled page without (`corsRuleFor`). Answers every preflight itself and refuses any other
 * `Origin` with 403, including other `soonlane.com` hosts and the API's own. A request without `Origin`
 * (SSR, Google's redirect back, the desktop app's main process) goes on to the handler, whose own origin
 * checks stay on; a provider that returned with a `form_post` would carry Google's origin and be refused.
 */
export function withCors(
	context: Context.Context<never>,
	trustedOrigins: readonly string[],
	handle: RequestHandler
) {
	return async (request: Request) => {
		const origin = request.headers.get('origin')
		const isPreflight = request.method === 'OPTIONS'

		if (origin === null)
			return isPreflight ? forbidden() : await handle(request)

		const rule = corsRuleFor(origin, trustedOrigins)

		if (!rule) return forbidden()

		const corsHeaders = {
			'access-control-allow-origin': origin,
			...(rule.credentials && { 'access-control-allow-credentials': 'true' }),
		}

		if (isPreflight)
			return new Response(null, {
				status: 204,
				headers: {
					...corsHeaders,
					...PREFLIGHT_HEADERS,
					'access-control-allow-headers': rule.allowedHeaders,
					vary: 'Origin',
				},
			})

		const response = await handleOrFail(context, handle, request)
		// A fresh response: one from a redirect helper can have immutable headers.
		const answer = new Response(response.body, response)

		for (const [name, value] of Object.entries(corsHeaders))
			answer.headers.set(name, value)
		if (!rule.credentials) answer.headers.delete('set-cookie')
		answer.headers.append('vary', 'Origin')

		return answer
	}
}
