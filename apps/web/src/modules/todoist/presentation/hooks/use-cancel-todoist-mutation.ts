import { APP_PATHS } from '@soonlane/app/app-paths'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { toastFailure } from '@soonlane/app/shell/helpers/maintenance.helper'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { TODOIST_COPY } from '../helpers/todoist-copy.constants'

/** Keeps the status cached, since the user menu reads it to show its import entry; dropping it hides the entry until the refetch lands. */
export function useCancelTodoistMutation() {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	return useMutation(
		orpcQuery.todoist.cancel.mutationOptions({
			onSuccess: async () => {
				queryClient.removeQueries({ queryKey: orpcQuery.todoist.preview.key() })
				void queryClient.invalidateQueries({
					queryKey: orpcQuery.todoist.status.key(),
				})
				toast(TODOIST_COPY.cancelled)
				await navigate({ to: APP_PATHS.upcoming })
			},
			onError: error => toastFailure(error, TODOIST_COPY.cancelFailed),
		})
	)
}
