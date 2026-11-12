import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { APP_PATHS } from '../../../app-path.constants'
import { orpcQuery } from '../../../rpc-query.client'
import { isLabelNamed } from '../../labels/helpers/label-name.helper'
import {
	forgetRecentViews,
	rememberRecentView,
} from '../helpers/recent-views.helper'
import { VIEW_SHORTCUTS } from '../keyboard-shortcuts.constants'

/** Remembers Upcoming, Today and label views as they open, and forgets labels that no longer exist. */
export function useTrackRecentViews(
	activePath: string,
	activeLabelName: string | undefined
) {
	const { data } = useQuery(orpcQuery.labels.list.queryOptions())
	const view = VIEW_SHORTCUTS.find(
		shortcut => APP_PATHS[shortcut.view] === activePath
	)?.view
	const labelId = data?.labels.find(label =>
		isLabelNamed(label, activeLabelName)
	)?.id

	useEffect(() => {
		if (view) rememberRecentView({ kind: 'view', id: view })
		else if (labelId) rememberRecentView({ kind: 'label', id: labelId })
	}, [view, labelId])

	useEffect(() => {
		if (!data) return

		forgetRecentViews(
			({ kind, id }) =>
				kind === 'label' && !data.labels.some(label => label.id === id)
		)
	}, [data])
}
