import { useMutation } from '@tanstack/react-query'
import { capture } from '@/modules/analytics/infrastructure/analytics.client'
import { signOut } from '@/platform/auth/auth.client'

/** Sent while still identified: the phone always ends its session, and the root layout resets analytics once it has. */
async function signOutTracked() {
	capture('user_signed_out', {})
	await signOut()
}

/** Signs out; the root layout returns to the sign-in screen, clears the query cache and resets analytics as soon as the session is gone. */
export function useSignOutMutation() {
	return useMutation({ mutationFn: signOutTracked })
}
