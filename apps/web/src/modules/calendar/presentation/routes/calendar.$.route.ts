import { createFileRoute } from '@tanstack/react-router'
import { PRIVATE_HEADERS } from '../calendar-feed.constants'

/** Any other path under `/calendar/` may hold a mistyped link, so it gets the feed's private 404 instead of the app's HTML 404 page. */
export const Route = createFileRoute('/calendar/$')({
	server: {
		handlers: {
			ANY: () => new Response(null, { status: 404, headers: PRIVATE_HEADERS }),
		},
	},
})
