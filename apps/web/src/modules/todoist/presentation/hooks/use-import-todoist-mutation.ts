import { APP_PATHS } from '@soonlane/app/app-paths'
import { refreshTaskAndLabelLists } from '@soonlane/app/labels/helpers/label-queries.helper'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { formatCount } from '../helpers/plural-copy.helper'
import {
	TODOIST_COPY,
	TODOIST_COUNT_COPY,
} from '../helpers/todoist-copy.constants'

/**
 * The connection closes either way, so both outcomes refetch the status: a failure because the page shows Connect
 * again from it, a success because the user menu reads it and must not lose its import entry meanwhile.
 */
export function useImportTodoistMutation() {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	return useMutation(
		orpcQuery.todoist.import.mutationOptions({
			onSuccess: async summary => {
				queryClient.removeQueries({ queryKey: orpcQuery.todoist.preview.key() })
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: orpcQuery.todoist.status.key(),
					}),
					refreshTaskAndLabelLists(queryClient),
					queryClient.invalidateQueries({
						queryKey: orpcQuery.projects.key(),
					}),
				])
				await navigate({ to: APP_PATHS.upcoming })
				toast(
					summary.tasks === 0
						? TODOIST_COPY.nothingNew
						: formatCount(summary.tasks, TODOIST_COUNT_COPY.importedTitle),
					{
						description: [
							summary.changedTasks > 0 &&
								formatCount(
									summary.changedTasks,
									TODOIST_COUNT_COPY.importedWithChanges
								),
							summary.leftOut > 0 &&
								formatCount(summary.leftOut, TODOIST_COUNT_COPY.leftOut),
							TODOIST_COPY.accessClosed,
						]
							.filter(Boolean)
							.join(' '),
					}
				)
			},
			onError: async () => {
				await queryClient.invalidateQueries({
					queryKey: orpcQuery.todoist.status.key(),
				})
			},
		})
	)
}
