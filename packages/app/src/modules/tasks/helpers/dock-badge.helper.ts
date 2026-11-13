import { getToday } from '@soonlane/domain'
import { matchQuery, type QueryClient } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'
import {
	isDesktopShell,
	sendToDesktopHost,
} from '../../shell/helpers/desktop-host.helper'
import { getTodayListInput } from './task-list-key.helper'

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

		if (event.type === 'removed')
			sendToDesktopHost({ type: 'dock-badge', count: 0 })
		if (list)
			sendToDesktopHost({
				type: 'dock-badge',
				count: list.overdue.length + list.scheduled.length,
			})
	})
}
