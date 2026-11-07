import { authClient } from '@soonlane/auth/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { resetAnalytics } from '@/modules/analytics/presentation/analytics.client'

// Better Auth deletes only from a session younger than its freshAge (one day).
async function deleteAccount() {
	const { error } = await authClient.deleteUser()

	if (error?.code === 'SESSION_EXPIRED') return { needsFreshSignIn: true }
	if (error) throw new Error('Could not delete the account. Try again.')

	return { needsFreshSignIn: false }
}

export function useDeleteAccountMutation() {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	return useMutation({
		mutationFn: deleteAccount,
		onSuccess: async ({ needsFreshSignIn }) => {
			if (needsFreshSignIn) return

			resetAnalytics()
			queryClient.clear()
			await navigate({
				to: '/login',
				search: { deleted: true },
				replace: true,
			})
		},
	})
}
