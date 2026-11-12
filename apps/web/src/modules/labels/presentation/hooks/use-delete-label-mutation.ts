import { isDefinedError } from '@orpc/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toastFailure } from '@/modules/shell/presentation/helpers/maintenance.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { refreshTaskAndLabelLists } from '../helpers/label-queries.helper'

export function useDeleteLabelMutation(onDeleted: () => void) {
	const queryClient = useQueryClient()

	return useMutation(
		orpcQuery.labels.delete.mutationOptions({
			onSuccess: onDeleted,
			onError: error =>
				toastFailure(
					error,
					isDefinedError(error)
						? error.message
						: 'Could not delete the label. Try again.'
				),
			onSettled: async () => await refreshTaskAndLabelLists(queryClient),
		})
	)
}
