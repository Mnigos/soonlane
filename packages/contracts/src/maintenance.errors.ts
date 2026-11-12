/** What the API answers to every call it refuses while maintenance is on: the oRPC error, and the JSON body of a 503 from `/api/auth`. */
export const MAINTENANCE_ERROR = {
	code: 'MAINTENANCE',
	message:
		'Changes and sign-in are paused for a few minutes during an update. Try again shortly.',
} as const
