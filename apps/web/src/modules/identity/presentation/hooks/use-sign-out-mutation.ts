import { authClient } from '@soonlane/auth/client'
import {
	mutationOptions,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

async function signOut() {
	const { error } = await authClient.signOut()

	if (error) throw new Error('Sign-out failed. Try again.')
}

export function useSignOutMutation() {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	return useMutation(
		mutationOptions({
			mutationFn: signOut,
			// The cached identity would keep the owner signed in until it goes stale.
			onSuccess: async () => {
				queryClient.clear()
				await navigate({ to: '/login' })
			},
		})
	)
}
