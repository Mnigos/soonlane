import type { CalendarDate } from '@soonlane/domain'
import { matchQuery, type QueryClient } from '@tanstack/react-query'
import {
	isDesktopShell,
	sendToDesktopHost,
} from '@/modules/shell/presentation/helpers/desktop-host.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { getToday } from '../../domain/calendar-date.helper'

export function getTodayListInput(today: CalendarDate) {
	return { from: today, to: today, today }
}

// Cache listeners run synchronously, so the count is sent before onCreated closes the Quick Add window.
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

		if (event.type === 'removed')
			sendToDesktopHost({ type: 'dock-badge', count: 0 })
		if (list)
			sendToDesktopHost({
				type: 'dock-badge',
				count: list.overdue.length + list.scheduled.length,
			})
	})
}
