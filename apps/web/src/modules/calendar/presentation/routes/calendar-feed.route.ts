import { createFileRoute } from '@tanstack/react-router'
import { Cause, Effect } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import { runtime } from '@/platform/app.runtime'
import { CalendarService } from '../../application/calendar.service'
import { PRIVATE_HEADERS } from '../calendar-feed.constants'

const buildFeed = Effect.fn('CalendarFeed.serve')(function* (token: string) {
	const calendarService = yield* CalendarService
	const analytics = yield* Analytics

	return yield* calendarService
		.buildFeed(token)
		.pipe(
			Effect.tapCause(cause => analytics.captureException(Cause.squash(cause)))
		)
})

/** Never logs or reports the request URL or the token; a thrown error would hand the URL to the framework's error log. */
async function serveFeed(token: string) {
	try {
		const feed = await runtime.runPromise(buildFeed(token))

		if (feed === undefined)
			return new Response(null, { status: 404, headers: PRIVATE_HEADERS })

		return new Response(feed, {
			headers: {
				...PRIVATE_HEADERS,
				'Content-Type': 'text/calendar; charset=utf-8',
			},
		})
	} catch (error) {
		Effect.runSync(
			Effect.logError(
				'Calendar feed failed',
				error instanceof Error ? error.name : typeof error
			)
		)

		return new Response(null, { status: 503, headers: PRIVATE_HEADERS })
	}
}

/** `ANY` answers every other method here, so no request with a token reaches the app's HTML 404 page; HEAD falls back to GET. */
export const Route = createFileRoute('/calendar/{$token}.ics')({
	server: {
		handlers: {
			GET: async ({ params }) => await serveFeed(params.token),
			ANY: () => new Response(null, { status: 404, headers: PRIVATE_HEADERS }),
		},
	},
})
