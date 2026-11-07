import { skipToken, useQuery } from '@tanstack/react-query'
import { isDesktopShell } from '@/modules/shell/presentation/helpers/desktop-host.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { getTodayListInput } from '../helpers/dock-badge.helper'
import { useToday } from './use-today'

// Keeps the Today list cached in every desktop window so syncDockBadge sees its changes.
export function useDockBadgeQuery() {
	const today = useToday()

	return useQuery(
		orpcQuery.tasks.list.queryOptions({
			input: today && isDesktopShell() ? getTodayListInput(today) : skipToken,
		})
	)
}
