import { Cause, type Context, Effect } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import type { AppServices } from '@/platform/app.runtime'
import { CalendarService } from '../application/calendar.service'
import { PRIVATE_HEADERS } from './calendar-feed.constants'

const FEED_PATH = /^\/calendar\/([^/]+)\.ics$/u

const buildFeed = Effect.fn('CalendarFeed.serve')(function* (token: string) {
	const calendarService = yield* CalendarService
	const analytics = yield* Analytics

	return yield* calendarService
		.buildFeed(token)
		.pipe(
			Effect.tapCause(cause => analytics.captureException(Cause.squash(cause)))
		)
})

function notFound() {
	return new Response(null, { status: 404, headers: PRIVATE_HEADERS })
}

/**
 * Serves `GET /calendar/<token>.ics`; every other method and path under
 * `/calendar/` gets the same empty 404, since it may hold a mistyped link.
 * Never logs or reports the request URL or the token.
 */
export function createCalendarFeedHandler(
	services: Context.Context<AppServices>
) {
	return async (request: Request) => {
		const token = FEED_PATH.exec(new URL(request.url).pathname)?.[1]

		if (!(token && (request.method === 'GET' || request.method === 'HEAD')))
			return notFound()

		try {
			const feed = await Effect.runPromiseWith(services)(buildFeed(token))

			if (feed === undefined) return notFound()

			return new Response(feed, {
				headers: {
					...PRIVATE_HEADERS,
					'Content-Type': 'text/calendar; charset=utf-8',
				},
			})
		} catch (error) {
			Effect.runSyncWith(services)(
				Effect.logError(
					'Calendar feed failed',
					error instanceof Error ? error.name : typeof error
				)
			)

			return new Response(null, { status: 503, headers: PRIVATE_HEADERS })
		}
	}
}
