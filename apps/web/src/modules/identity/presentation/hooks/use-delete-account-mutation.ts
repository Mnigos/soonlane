import { resetAnalytics } from '@soonlane/analytics/client'
import { GOOGLE_LOGIN_NOT_RENEWED } from '@soonlane/auth'
import { authClient } from '@soonlane/auth/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

export const DELETE_ACCOUNT_FAILED = 'Could not delete the account. Try again.'

/** The API deletes only from a session that started with a Google login at most five minutes old; otherwise `SESSION_EXPIRED` asks for a fresh sign-in, with reason `GOOGLE_LOGIN_NOT_RENEWED` when this browser's Google would skip checking the user. */
async function deleteAccount() {
	const { error } = await authClient.deleteUser()

	if (error?.code === 'SESSION_EXPIRED')
		return {
			needsFreshSignIn: true,
			isGoogleLoginStale:
				'reason' in error && error.reason === GOOGLE_LOGIN_NOT_RENEWED,
		}
	if (error) throw new Error(DELETE_ACCOUNT_FAILED, { cause: error })

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
