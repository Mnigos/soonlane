import { createFileRoute } from '@tanstack/react-router'
import { SITE_URL } from '../site.constants'

const CANONICAL_ROBOTS = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /calendar/

Sitemap: ${SITE_URL}/sitemap.xml
`

/** The app host, staging, Railway's generated hosts and www are never crawled; only the canonical host may be. */
const BLOCKING_ROBOTS = `User-agent: *
Disallow: /
`

export const Route = createFileRoute('/robots.txt')({
	server: {
		handlers: {
			GET: ({ request }) =>
				new Response(
					new URL(request.url).host === new URL(SITE_URL).host
						? CANONICAL_ROBOTS
						: BLOCKING_ROBOTS,
					{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
				),
		},
	},
})
