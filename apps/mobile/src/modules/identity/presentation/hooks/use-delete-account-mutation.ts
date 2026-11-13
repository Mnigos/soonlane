import { useMutation } from '@tanstack/react-query'
import { Alert } from 'react-native'
import { showToast } from '@/modules/shell/presentation/toast.client'
import {
	deleteUser,
	NO_SESSION,
	SESSION_CHANGED,
} from '@/platform/auth/auth.client'

export const DELETE_ACCOUNT_FAILED = 'Could not delete the account. Try again.'
export const ACCOUNT_NOT_DELETED = 'Account not deleted'

/** The account a deletion was started for; only this user is ever deleted. */
export interface Account {
	id: string
	email: string
}

/** Tells a user the app signed out during a deletion it could not confirm: no session also follows an expiry, a revocation or a deletion elsewhere. */
export function alertSignedOutUnconfirmed({ email }: Account) {
	Alert.alert(
		'Deletion not confirmed',
		`You were signed out, and the deletion of ${email} could not be confirmed. If you still want to delete ${email}, sign in again and delete it from Settings.`,
		[{ text: 'OK' }],
		{ userInterfaceStyle: 'dark' }
	)
}

/** After a sheet or a deletion found `user` signed in instead of `startedFor`; nothing was deleted and no deletion is offered. */
export function alertOtherAccount(user: Account, startedFor: Account) {
	Alert.alert(
		ACCOUNT_NOT_DELETED,
		`You are now signed in as ${user.email}, and ${startedFor.email} was not deleted. To delete ${startedFor.email}, sign out and sign in with that account.`,
		[{ text: 'OK' }],
		{ userInterfaceStyle: 'dark' }
	)
}

/** Better Auth deletes only from a session younger than its freshAge (one day). */
async function deleteAccount({ id }: Account) {
	const { isDeleted, error, signedInAs } = await deleteUser(id)

	if (isDeleted) return { status: 'deleted' } as const
	if (error?.code === 'SESSION_EXPIRED')
		return { status: 'needs-fresh-sign-in' } as const
	if (signedInAs) return { status: 'signed-in-as', user: signedInAs } as const
	if (error?.code === NO_SESSION || error?.code === SESSION_CHANGED)
		return { status: 'signed-out' } as const

	throw new Error(DELETE_ACCOUNT_FAILED, { cause: error })
}

/** Deletes the account it gets; the root layout then shows the sign-in screen and clears the query cache, as after a sign-out. */
export function useDeleteAccountMutation() {
	return useMutation({
		mutationFn: deleteAccount,
		// Runs after the session ended, also once Settings unmounted, unlike the callbacks given to mutate; the root layout's hideToast on that change has already run.
		onSuccess: (result, account) => {
			if (result.status === 'deleted') showToast('Your account was deleted.')
			if (result.status === 'signed-out') alertSignedOutUnconfirmed(account)
			if (result.status === 'signed-in-as')
				alertOtherAccount(result.user, account)
		},
		onError: () =>
			Alert.alert(DELETE_ACCOUNT_FAILED, undefined, undefined, {
				userInterfaceStyle: 'dark',
			}),
	})
}
