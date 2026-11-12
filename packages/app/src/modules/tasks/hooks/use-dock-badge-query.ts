import { skipToken, useQuery } from '@tanstack/react-query'
import { orpcQuery } from '../../../rpc-query.client'
import { isDesktopShell } from '../../shell/helpers/desktop-host.helper'
import { getTodayListInput } from '../helpers/dock-badge.helper'
import { useToday } from './use-today'

/** Keeps the Today list loaded and refetched in every desktop window, so `syncDockBadge` sees each change. */
export function useDockBadgeQuery() {
	const today = useToday()

	return useQuery(
		orpcQuery.tasks.list.queryOptions({
			input: today && isDesktopShell() ? getTodayListInput(today) : skipToken,
		})
	)
}
