import { authClient } from '@soonlane/auth/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { resetAnalytics } from '@/modules/analytics/presentation/analytics.client'

async function signOut() {
	const { error } = await authClient.signOut()

	if (error) throw new Error('Sign-out failed. Try again.')
}

export function useSignOutMutation() {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	return useMutation({
		mutationFn: signOut,
		onSuccess: async () => {
			resetAnalytics()
			queryClient.clear()
			await navigate({ to: '/login' })
		},
	})
}
