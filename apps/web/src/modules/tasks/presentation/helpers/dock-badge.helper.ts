import type { CalendarDate } from '@soonlane/domain'
import { matchQuery, type QueryClient } from '@tanstack/react-query'
import {
	isDesktopShell,
	sendToDesktopHost,
} from '@/modules/shell/presentation/helpers/desktop-host.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { getToday } from '../../domain/calendar-date.helper'

/** The Today list's input: overdue tasks and the ones due today. */
export function getTodayListInput(today: CalendarDate) {
	return { from: today, to: today, today }
}

/** Reports the Today list's count to the Dock badge on every data change; cache listeners run synchronously, before the change's callbacks. */
export function syncDockBadge(queryClient: QueryClient) {
	if (!isDesktopShell()) return

	queryClient.getQueryCache().subscribe(event => {
		const todayKey = orpcQuery.tasks.list.queryKey({
			input: getTodayListInput(getToday(new Date())),
		})

		if (!matchQuery({ queryKey: todayKey, exact: true }, event.query)) return

		const list =
			event.type === 'updated' && event.action.type === 'success'
				? queryClient.getQueryData(todayKey)
				: undefined

		// Sign-out clears the cache, which removes the list.
		if (event.type === 'removed')
			sendToDesktopHost({ type: 'dock-badge', count: 0 })
		if (list)
			sendToDesktopHost({
				type: 'dock-badge',
				count: list.overdue.length + list.scheduled.length,
			})
	})
}
