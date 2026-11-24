import { rateLimit } from '@soonlane/db'
import { sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'

export interface RateLimitCount {
	/** The counter's row in `rate_limit`, which Better Auth's own limits share, so it carries a prefix of its own. */
	key: string
	windowMs: number
	/** When the request came, in milliseconds, as `last_request` stores it. */
	now: number
}

export class RateLimitRepository extends Context.Service<
	RateLimitRepository,
	{
		/**
		 * Counts one more request in a fixed window that starts with the first request after the last one ended, atomically, and answers how many
		 * the window holds now. Better Auth prunes rows older than its longest rule's window, an hour, so a window must stay shorter than that.
		 */
		readonly count: (count: RateLimitCount) => Effect.Effect<number, DbError>
	}
>()('soonlane/RateLimitRepository') {}

export const RateLimitRepositoryLive = Layer.effect(
	RateLimitRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return RateLimitRepository.of({
			count: ({ key, windowMs, now }) =>
				db.run('RateLimitRepository.count', async database => {
					const expired = sql`${rateLimit.lastRequest} < ${now - windowMs}`
					const [row] = await database
						.insert(rateLimit)
						.values({ key, count: 1, lastRequest: now })
						.onConflictDoUpdate({
							target: rateLimit.key,
							set: {
								count: sql`case when ${expired} then 1 else ${rateLimit.count} + 1 end`,
								lastRequest: sql`case when ${expired} then ${now} else ${rateLimit.lastRequest} end`,
							},
						})
						.returning({ count: rateLimit.count })

					return row?.count ?? 0
				}),
		})
	})
)
