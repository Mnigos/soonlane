/** The link is the credential: no shared cache keeps the feed, so a revoked link stops at once; no crawler indexes it; no page opened from an event learns it. */
export const PRIVATE_HEADERS = {
	'Cache-Control': 'private, no-store',
	'Referrer-Policy': 'no-referrer',
	'X-Robots-Tag': 'noindex, nofollow',
}
