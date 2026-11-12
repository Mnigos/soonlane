import { isDefinedError } from '@orpc/client'
import { updateLabelInputSchema } from '@soonlane/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toastFailure } from '@/modules/shell/presentation/helpers/maintenance.helper'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import {
	paintLabel,
	refreshTaskAndLabelLists,
} from '../helpers/label-queries.helper'

/**
 * Saves a label's color, showing it everywhere at once and painting the old one back if saving fails.
 * While a later label update is in flight, a failure keeps that update's newer color and only the last
 * one to settle refetches, so neither rollback nor refetch wipes a pending pick.
 */
export function useUpdateLabelColorMutation() {
	const queryClient = useQueryClient()
	const isLastUpdate = () =>
		queryClient.isMutating({
			mutationKey: orpcQuery.labels.update.mutationKey(),
		}) === 1

	return useMutation(
		orpcQuery.labels.update.mutationOptions({
			onMutate: async variables => {
				const { id, color } = updateLabelInputSchema.parse(variables)

				return {
					id,
					previousColor: await paintLabel(queryClient, id, color ?? undefined),
				}
			},
			onError: async (error, _variables, context) => {
				toastFailure(
					error,
					isDefinedError(error)
						? error.message
						: "Could not change the label's color. Try again."
				)
				if (context && isLastUpdate())
					await paintLabel(queryClient, context.id, context.previousColor)
			},
			onSettled: async () => {
				if (isLastUpdate()) await refreshTaskAndLabelLists(queryClient)
			},
		})
	)
}
