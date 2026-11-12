import { capture, resetAnalytics } from '@soonlane/analytics/client'
import { authClient } from '@soonlane/auth/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

export const SIGN_OUT_FAILED = 'Sign-out failed. Try again.'

async function signOut() {
	const { error } = await authClient.signOut()

	if (error) throw new Error(SIGN_OUT_FAILED, { cause: error })
}

export function useSignOutMutation() {
	const queryClient = useQueryClient()
	const navigate = useNavigate()

	return useMutation({
		mutationFn: signOut,
		onSuccess: async () => {
			capture('user_signed_out', {})
			resetAnalytics()
			queryClient.clear()
			await navigate({ to: '/login' })
		},
	})
}
