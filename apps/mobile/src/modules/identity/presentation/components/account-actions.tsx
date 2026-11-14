import { useMutation } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { Alert } from 'react-native'
import { OutlineButton } from '@/modules/shell/presentation/components/outline-button'
import {
	cancelHandOff,
	isHandOffCancellable,
	subscribeToHandOff,
} from '@/platform/auth/android-hand-off.client'
import {
	signInWithGoogle,
	storedSessionToken,
	verifiedUser,
} from '@/platform/auth/auth.client'
import {
	alertOtherAccount,
	alertSignedOutUnconfirmed,
	useDeleteAccountMutation,
	type Account,
} from '../hooks/use-delete-account-mutation'
import { useSignOutMutation } from '../hooks/use-sign-out-mutation'
import { SIGN_IN_FAILED, signInFailureMessage } from './sign-in-screen'

const DELETE_ACCOUNT_TITLE = 'Delete your account?'
const FRESH_SIGN_IN_REQUIRED =
	'For your safety, sign in again to delete your account.'
const ALERT_OPTIONS = { userInterfaceStyle: 'dark' } as const

interface AccountActionsProps {
	account: Account
}

/**
 * Signs in again (the iOS sheet, or the Android hand-off) and returns the user the server says that
 * sign-in belongs to. Undefined when the server could not say: the phone is
 * then signed out, so no screen names one user while the Keychain holds another.
 */
async function signInAgain({ email }: Account) {
	const tokenBefore = await storedSessionToken()
	const { error } = await signInWithGoogle({ loginHint: email, fresh: true })

	if (error) throw new Error(SIGN_IN_FAILED, { cause: error })
	// Closing the sheet also ends without an error; only a new session token shows a sign-in.
	if ((await storedSessionToken()) === tokenBefore)
		throw new Error(SIGN_IN_FAILED)

	return await verifiedUser()
}

/**
 * Sign out, and the web's account deletion as iOS alerts: confirm, and when
 * the session is too old, sign in again and confirm once more, only when the
 * sheet signed in the same user. Both buttons wait while either runs.
 */
export function AccountActions({ account }: Readonly<AccountActionsProps>) {
	const signOutMutation = useSignOutMutation()
	const deletion = useDeleteAccountMutation()
	const freshSignIn = useMutation({
		mutationFn: signInAgain,
		onSuccess: (user, startedFor) => {
			if (!user) alertSignedOutUnconfirmed(startedFor)
			else if (user.id === startedFor.id) confirmDeletion(user)
			else alertOtherAccount(user, startedFor)
		},
		onError: (error, startedFor) =>
			askForFreshSignIn(signInFailureMessage(error), startedFor),
	})
	const isCancellable = useSyncExternalStore(
		subscribeToHandOff,
		isHandOffCancellable
	)
	const isBusy =
		signOutMutation.isPending || deletion.isPending || freshSignIn.isPending

	function confirmDeletion(confirmed: Account) {
		Alert.alert(
			DELETE_ACCOUNT_TITLE,
			`This deletes ${confirmed.email} and all its tasks right away. It cannot be undone.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete account',
					style: 'destructive',
					onPress: () => deleteAccount(confirmed),
				},
			],
			ALERT_OPTIONS
		)
	}

	function deleteAccount(confirmed: Account) {
		deletion.mutate(confirmed, {
			onSuccess: ({ status }) => {
				if (status === 'needs-fresh-sign-in')
					askForFreshSignIn(DELETE_ACCOUNT_TITLE, confirmed)
			},
		})
	}

	function askForFreshSignIn(title: string, startedFor: Account) {
		Alert.alert(
			title,
			FRESH_SIGN_IN_REQUIRED,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Continue with Google',
					onPress: () => freshSignIn.mutate(startedFor),
				},
			],
			ALERT_OPTIONS
		)
	}

	return (
		<>
			<OutlineButton disabled={isBusy} onPress={() => signOutMutation.mutate()}>
				Sign out
			</OutlineButton>

			<OutlineButton
				destructive
				disabled={isBusy}
				onPress={() => confirmDeletion(account)}
			>
				{deletion.isPending ? 'Deleting…' : 'Delete account'}
			</OutlineButton>

			{freshSignIn.isPending && isCancellable && (
				<OutlineButton onPress={cancelHandOff}>Cancel</OutlineButton>
			)}
		</>
	)
}
