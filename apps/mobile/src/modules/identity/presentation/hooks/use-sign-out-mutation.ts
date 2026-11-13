import { useMutation } from '@tanstack/react-query'
import { signOut } from '@/platform/auth/auth.client'

/** Signs out; the root layout returns to the sign-in screen and clears the query cache as soon as the session is gone. */
export function useSignOutMutation() {
	return useMutation({ mutationFn: signOut })
}
