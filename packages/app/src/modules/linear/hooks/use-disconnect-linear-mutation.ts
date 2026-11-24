import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getHostPorts } from '../../../host-ports.client'
import { orpcQuery } from '../../../rpc-query.client'
import { LINEAR_COPY } from '../helpers/linear-copy.constants'

export function useDisconnectLinearMutation() {
	const queryClient = useQueryClient()
	const { showToast } = getHostPorts()

	return useMutation(
		orpcQuery.linear.disconnect.mutationOptions({
			onSuccess: () => showToast(LINEAR_COPY.toastDisconnected),
			onError: () => showToast(LINEAR_COPY.errorDisconnect),
			onSettled: async () =>
				await queryClient.invalidateQueries({
					queryKey: orpcQuery.linear.status.key(),
				}),
		})
	)
}
