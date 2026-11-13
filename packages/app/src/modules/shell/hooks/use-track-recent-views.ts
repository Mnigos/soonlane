import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { APP_PATHS } from '../../../app-path.constants'
import { orpcQuery } from '../../../rpc-query.client'
import { isNamed } from '../../tasks/helpers/task-view.helper'
import {
	forgetRecentViews,
	rememberRecentView,
} from '../helpers/recent-views.helper'
import { VIEW_SHORTCUTS } from '../keyboard-shortcuts.constants'

/** Only a loaded list can miss an id, so nothing is forgotten while a list loads. */
function isMissingFrom(items: { id: string }[] | undefined, id: string) {
	return items !== undefined && !items.some(item => item.id === id)
}

/** Remembers Upcoming, Today, project and label views as they open, and forgets projects and labels that no longer exist. */
export function useTrackRecentViews(
	activePath: string,
	activeLabelName: string | undefined,
	activeProjectName: string | undefined
) {
	const { data: labelData } = useQuery(orpcQuery.labels.list.queryOptions())
	const { data: projectData } = useQuery(orpcQuery.projects.list.queryOptions())
	const view = VIEW_SHORTCUTS.find(
		shortcut => APP_PATHS[shortcut.view] === activePath
	)?.view
	const labelId = labelData?.labels.find(label =>
		isNamed(label, activeLabelName)
	)?.id
	const projectId = projectData?.projects.find(project =>
		isNamed(project, activeProjectName)
	)?.id

	useEffect(() => {
		if (view) rememberRecentView({ kind: 'view', id: view })
		else if (labelId) rememberRecentView({ kind: 'label', id: labelId })
		else if (projectId) rememberRecentView({ kind: 'project', id: projectId })
	}, [view, labelId, projectId])

	useEffect(() => {
		if (!labelData && !projectData) return

		forgetRecentViews(
			({ kind, id }) =>
				(kind === 'label' && isMissingFrom(labelData?.labels, id)) ||
				(kind === 'project' && isMissingFrom(projectData?.projects, id))
		)
	}, [labelData, projectData])
}
