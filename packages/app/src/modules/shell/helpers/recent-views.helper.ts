import { labelIdSchema, projectIdSchema, taskIdSchema } from '@soonlane/domain'
import { z } from 'zod'
import { VIEW_SHORTCUTS } from '../keyboard-shortcuts.constants'

const RECENT_VIEWS_KEY = 'soonlane-recent-views'
const RECENT_VIEWS_LIMIT = 5
const recentViewsSchema = z.array(
	z.discriminatedUnion('kind', [
		z.object({
			kind: z.literal('view'),
			id: z.literal(VIEW_SHORTCUTS.map(({ view }) => view)),
		}),
		z.object({ kind: z.literal('project'), id: projectIdSchema }),
		z.object({ kind: z.literal('label'), id: labelIdSchema }),
		z.object({ kind: z.literal('task'), id: taskIdSchema }),
	])
)
export type RecentView = z.infer<typeof recentViewsSchema>[number]

/** This device's recently viewed views, projects, labels and tasks, newest first; empty when storage is blocked or holds something else. */
export function readRecentViews(): RecentView[] {
	try {
		return recentViewsSchema.parse(
			JSON.parse(localStorage.getItem(RECENT_VIEWS_KEY) ?? '[]')
		)
	} catch {
		return []
	}
}

function writeRecentViews(views: RecentView[]) {
	try {
		localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(views))
	} catch {
		// Blocked storage or a full quota: the palette works without Recent.
	}
}

export function rememberRecentView(view: RecentView) {
	writeRecentViews(
		[
			view,
			...readRecentViews().filter(
				({ kind, id }) => kind !== view.kind || id !== view.id
			),
		].slice(0, RECENT_VIEWS_LIMIT)
	)
}

export function forgetRecentViews(isGone: (view: RecentView) => boolean) {
	writeRecentViews(readRecentViews().filter(view => !isGone(view)))
}
