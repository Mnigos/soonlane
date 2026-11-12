import { APP_PATHS } from '@soonlane/app/app-paths'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { toastFailure } from '@soonlane/app/shell/helpers/maintenance.helper'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { TODOIST_COPY } from '../helpers/todoist-copy.constants'

export function useCancelTodoistMutation() {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	return useMutation(
		orpcQuery.todoist.cancel.mutationOptions({
			onSuccess: async () => {
				queryClient.removeQueries({ queryKey: orpcQuery.todoist.key() })
				toast(TODOIST_COPY.cancelled)
				await navigate({ to: APP_PATHS.upcoming })
			},
			onError: error => toastFailure(error, TODOIST_COPY.cancelFailed),
		})
	)
}
