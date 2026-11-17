/** RFC 6749 and RFC 7009 error codes; any other text in a provider's response stays out of the logs. */
const OAUTH_ERROR_CODES = new Set<unknown>([
	'invalid_request',
	'invalid_client',
	'invalid_grant',
	'unauthorized_client',
	'unsupported_grant_type',
	'invalid_scope',
	'unsupported_token_type',
	'access_denied',
	'server_error',
	'temporarily_unavailable',
])

/** Drizzle query errors embed SQL parameters, which include session tokens, and a provider's failed response arrives as a plain object holding its body: an error becomes its name, any other object a known OAuth error code and its numeric status at most. */
export function redactLogArgument(argument: unknown) {
	if (argument instanceof Error) return argument.name
	if (typeof argument !== 'object' || argument === null) return argument

	const code =
		'error' in argument && OAUTH_ERROR_CODES.has(argument.error)
			? String(argument.error)
			: '[object]'

	return 'status' in argument && typeof argument.status === 'number'
		? `${code} ${argument.status}`
		: code
}
