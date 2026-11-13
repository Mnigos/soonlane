import { ORPCError } from '@orpc/client'
import type { Label, ListedProject } from '@soonlane/contracts'
import { useQueries } from '@tanstack/react-query'
import { useMemo } from 'react'
import { orpcQuery } from '../../../rpc-query.client'
import {
	forgetRecentViews,
	readRecentViews,
} from '../helpers/recent-views.helper'
import { VIEW_SHORTCUTS } from '../keyboard-shortcuts.constants'
import type { PaletteItem } from '../search-palette.types'

/** The palette's Recent rows: projects and labels resolved against their lists, tasks through `tasks.get`; a deleted task also leaves storage. */
export function useRecentItems(
	labels: Label[] | undefined,
	projects: ListedProject[] | undefined
): PaletteItem[] {
	const views = useMemo(() => readRecentViews(), [])
	const tasks = useQueries({
		queries: views.flatMap(view => {
			if (view.kind !== 'task') return []

			const options = orpcQuery.tasks.get.queryOptions({
				input: { id: view.id },
				staleTime: 0,
			})

			return {
				...options,
				queryFn: async (context: Parameters<typeof options.queryFn>[0]) => {
					try {
						return await options.queryFn(context)
					} catch (error) {
						if (error instanceof ORPCError && error.code === 'NOT_FOUND')
							forgetRecentViews(
								({ kind, id }) => kind === 'task' && id === view.id
							)
						throw error
					}
				},
			}
		}),
		// A failed refetch keeps the cached task, so a task deleted since it was cached must check the error too.
		combine: results =>
			results.flatMap(({ data, error }) => (error ? [] : (data?.task ?? []))),
	})

	return views.flatMap((view): PaletteItem[] => {
		if (view.kind === 'view')
			return VIEW_SHORTCUTS.filter(shortcut => shortcut.view === view.id).map(
				shortcut => ({ kind: 'view', view: shortcut })
			)

		if (view.kind === 'project') {
			const project = projects?.find(({ id }) => id === view.id)

			return project ? [{ kind: 'project', project }] : []
		}

		if (view.kind === 'label') {
			const label = labels?.find(({ id }) => id === view.id)

			return label ? [{ kind: 'label', label }] : []
		}

		const task = tasks.find(({ id }) => id === view.id)

		return task && !task.completedAt ? [{ kind: 'task', task }] : []
	})
}
