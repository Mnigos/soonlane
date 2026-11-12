import type { BetterAuthPlugin } from 'better-auth'

/** The body fields Better Auth redirects the browser to; its email-link GET endpoints also redirect to a query `callbackURL`. */
const RETURN_ADDRESS_FIELDS = [
	'callbackURL',
	'errorCallbackURL',
	'newUserCallbackURL',
	'redirectTo',
] as const
/** Google sign-in without a body `callbackURL` would return to the API's own origin. */
const SOCIAL_SIGN_IN_PATH = '/sign-in/social'

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

/** Absolute and on a trusted web origin: Better Auth itself would also accept relative paths and its own host. */
function isReturnAddress(value: unknown, trustedOrigins: readonly string[]) {
	return (
		typeof value === 'string' &&
		URL.canParse(value) &&
		trustedOrigins.includes(new URL(value).origin)
	)
}

/**
 * Refuses with 400 any request whose return address (every body field Better
 * Auth redirects to, and each query `callbackURL`) is not an absolute URL on a
 * trusted web origin, and Google sign-in without a body `callbackURL`. It runs
 * before Better Auth routes the request, so its own checks never answer first.
 */
export function returnAddresses(trustedOrigins: readonly string[]) {
	return {
		id: 'return-addresses',
		onRequest: async (request, context) => {
			const url = new URL(request.url)
			const body = await readBody(request)
			const addresses = [
				...RETURN_ADDRESS_FIELDS.flatMap(field => readField(body, field)),
				...url.searchParams.getAll('callbackURL'),
			]
			const isMissingCallback =
				url.pathname ===
					`${new URL(context.baseURL).pathname}${SOCIAL_SIGN_IN_PATH}` &&
				readField(body, 'callbackURL').length === 0

			if (
				isMissingCallback ||
				!addresses.every(value => isReturnAddress(value, trustedOrigins))
			)
				return {
					response: Response.json(
						{
							code: 'INVALID_RETURN_ADDRESS',
							message:
								'Return addresses must be absolute URLs on a trusted origin.',
						},
						{ status: 400 }
					),
				}

			return undefined
		},
	} satisfies BetterAuthPlugin
}
