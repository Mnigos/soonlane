import type { BetterAuthPlugin } from 'better-auth'

/** The body fields Better Auth redirects the browser to; its email-link GET endpoints also redirect to a query `callbackURL`. */
const RETURN_ADDRESS_FIELDS = [
	'callbackURL',
	'errorCallbackURL',
	'newUserCallbackURL',
	'redirectTo',
] as const
/** A provider redirect started without a body `callbackURL` would return to the API's own origin. */
const PROVIDER_REDIRECT_PATHS = ['/sign-in/social', '/link-social']
/** The only requests that may return to an app scheme: after a callback the Expo plugin adds the response's cookies to that address, which an account link must never reach. */
const APP_SIGN_IN_PATHS = ['/sign-in/social']

/** better-call's media types, in its order: a JSON type wins over a `form` parameter. */
const JSON_CONTENT_TYPE = /^application\/([a-z0-9.+-]*\+)?json/iu
const FORM_CONTENT_TYPES = [
	'application/x-www-form-urlencoded',
	'multipart/form-data',
]

/**
 * The body as Better Auth parses it; any other type reaches it as text or bytes, without fields.
 * Mirrors better-call 1.4.5's `getBody`, so a Better Auth or better-call upgrade must recheck it.
 */
async function readBody(request: Request): Promise<unknown> {
	const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''

	if (!request.body) return undefined

	try {
		if (JSON_CONTENT_TYPE.test(contentType)) return await request.clone().json()
		if (FORM_CONTENT_TYPES.some(type => contentType.includes(type)))
			return await request.clone().formData()
	} catch {
		return undefined
	}

	return undefined
}

/** Every value of a body field: all of a form's entries under that name, or a JSON object's one. */
function readField(body: unknown, field: string): unknown[] {
	if (body instanceof FormData) return body.getAll(field)
	if (typeof body !== 'object' || body === null) return []

	const value: unknown = Object.getOwnPropertyDescriptor(body, field)?.value

	return value === undefined ? [] : [value]
}

/**
 * Absolute and on a trusted web origin or one of the app schemes (`soonlane:`), whose URLs all have the origin `null`.
 * Better Auth itself would also accept relative paths and its own host.
 */
function isReturnAddress(
	value: unknown,
	trustedOrigins: readonly string[],
	appSchemes: readonly string[]
) {
	const url = typeof value === 'string' ? URL.parse(value) : null

	return (
		url !== null &&
		(trustedOrigins.includes(url.origin) || appSchemes.includes(url.protocol))
	)
}

/**
 * Refuses with 400 any request whose return address (every body field Better
 * Auth redirects to, and each query `callbackURL`) is not an absolute URL on a
 * trusted web origin or, on a sign-in, an app scheme (`appSchemes`, such as
 * `soonlane:`), and a provider sign-in or link without a body `callbackURL`.
 * It runs before Better Auth routes the request, so its own checks never
 * answer first.
 */
export function returnAddresses(
	trustedOrigins: readonly string[],
	appSchemes: readonly string[]
) {
	return {
		id: 'return-addresses',
		onRequest: async (request, context) => {
			const url = new URL(request.url)
			const body = await readBody(request)
			const addresses = [
				...RETURN_ADDRESS_FIELDS.flatMap(field => readField(body, field)),
				...url.searchParams.getAll('callbackURL'),
			]
			const basePath = new URL(context.baseURL).pathname
			const isOn = (paths: readonly string[]) =>
				paths.some(path => url.pathname === `${basePath}${path}`)
			const isMissingCallback =
				isOn(PROVIDER_REDIRECT_PATHS) &&
				readField(body, 'callbackURL').length === 0
			const schemes = isOn(APP_SIGN_IN_PATHS) ? appSchemes : []

			if (
				isMissingCallback ||
				!addresses.every(value =>
					isReturnAddress(value, trustedOrigins, schemes)
				)
			)
				return {
					response: Response.json(
						{
							code: 'INVALID_RETURN_ADDRESS',
							message:
								'Return addresses must be absolute URLs on a trusted origin, or the app scheme on a sign-in.',
						},
						{ status: 400 }
					),
				}

			return undefined
		},
	} satisfies BetterAuthPlugin
}
