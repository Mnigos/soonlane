import { createFileRoute } from '@tanstack/react-router'
import { LANDING_URL } from '../landing.constants'

const CANONICAL_ROBOTS = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /calendar/

Sitemap: ${LANDING_URL}/sitemap.xml
`

/** Staging and local builds are never crawled; only production's landing may be. */
const BLOCKING_ROBOTS = `User-agent: *
Disallow: /
`

/** Prerendered to `robots.txt` at build time, so the build's `APP_ENV` decides it. */
export const Route = createFileRoute('/robots.txt')({
	server: {
		handlers: {
			GET: () =>
				new Response(
					import.meta.env.APP_ENVIRONMENT === 'production'
						? CANONICAL_ROBOTS
						: BLOCKING_ROBOTS,
					{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
				),
		},
	},
})
