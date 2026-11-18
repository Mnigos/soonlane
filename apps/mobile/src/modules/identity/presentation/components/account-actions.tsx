import type { ReauthMethod } from '@soonlane/auth'
import { useMutation } from '@tanstack/react-query'
import { useState, useSyncExternalStore } from 'react'
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
import { EMAIL_CODE_COPY } from '../email-code-copy.constants'
import { sendCodeTo } from '../helpers/email-code.helper'
import {
	alertOtherAccount,
	alertSignedOutUnconfirmed,
	DELETE_ACCOUNT_FAILED,
	useDeleteAccountMutation,
	type Account,
} from '../hooks/use-delete-account-mutation'
import { useSignOutMutation } from '../hooks/use-sign-out-mutation'
import { EmailCodeForm } from './email-code-form'
import { SIGN_IN_FAILED, signInFailureMessage } from './sign-in-screen'

const DELETE_ACCOUNT_TITLE = 'Delete your account?'
const FRESH_SIGN_IN_REQUIRED =
	'For your safety, sign in again to delete your account.'
const GOOGLE_SIGN_OUT_REQUIRED =
	'For your safety, deleting your account requires a fresh sign-in where Google verifies you. Sign out of Google in your phone\'s browser first, then press "Continue with Google".'
const ALERT_OPTIONS = { userInterfaceStyle: 'dark' } as const

/** A Google sign-in again for the account a deletion was started for, with the ways back in the server offered. */
interface FreshSignIn {
	startedFor: Account
	reauth: readonly ReauthMethod[]
}

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
	const [codeFor, setCodeFor] = useState<Account>()
	const sendingCode = useMutation({
		mutationFn: async (startedFor: Account) => {
			const sent = await sendCodeTo(startedFor.email)

			if (sent instanceof Error) throw sent

			return startedFor
		},
		onError: error =>
			Alert.alert(error.message, undefined, undefined, ALERT_OPTIONS),
	})
	const verifying = useMutation({ mutationFn: verifiedUser })
	const freshSignIn = useMutation({
		mutationFn: async ({ startedFor }: FreshSignIn) =>
			await signInAgain(startedFor),
		onSuccess: (user, { startedFor }) => continueWith(user, startedFor),
		// The retry offers what the server offered, so a failed Google sign-in keeps the email code.
		onError: (error, { startedFor, reauth }) =>
			askForFreshSignIn(signInFailureMessage(error), startedFor, reauth),
	})
	const isCancellable = useSyncExternalStore(
		subscribeToHandOff,
		isHandOffCancellable
	)
	const isBusy =
		signOutMutation.isPending ||
		deletion.isPending ||
		freshSignIn.isPending ||
		sendingCode.isPending ||
		verifying.isPending ||
		codeFor !== undefined

	/** After a fresh sign-in, by Google or by code, deletes only when it signed in the user the deletion was started for. */
	function continueWith(user: Account | undefined, startedFor: Account) {
		if (!user) alertSignedOutUnconfirmed(startedFor)
		else if (user.id === startedFor.id) confirmDeletion(user)
		else alertOtherAccount(user, startedFor)
	}

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
			onSuccess: result => {
				if (result.status === 'needs-fresh-sign-in')
					askForFreshSignIn(
						DELETE_ACCOUNT_TITLE,
						confirmed,
						result.reauth,
						result.isGoogleLoginStale ? GOOGLE_SIGN_OUT_REQUIRED : undefined
					)
			},
		})
	}

	/** Mails the code from the alert itself, so the form opens at the code step. */
	function sendCode(startedFor: Account) {
		sendingCode.mutate(startedFor, { onSuccess: setCodeFor })
	}

	/** The code signed the phone in; whom it signed in decides whether the deletion goes on. The callbacks go with these calls, so leaving Settings drops them. */
	function confirmCode(startedFor: Account) {
		setCodeFor(undefined)
		verifying.mutate(undefined, {
			onSuccess: user => continueWith(user, startedFor),
		})
	}

	function askForFreshSignIn(
		title: string,
		startedFor: Account,
		reauth: readonly ReauthMethod[] = ['google'],
		message = FRESH_SIGN_IN_REQUIRED
	) {
		// No method left to prove it is the user, such as a server that turned both off.
		if (reauth.length === 0) {
			Alert.alert(DELETE_ACCOUNT_FAILED, undefined, undefined, ALERT_OPTIONS)

			return
		}

		Alert.alert(
			title,
			message,
			[
				{ text: 'Cancel', style: 'cancel' },
				...(reauth.includes('email')
					? [
							{
								text: EMAIL_CODE_COPY.sendForReauth,
								onPress: () => sendCode(startedFor),
							},
						]
					: []),
				...(reauth.includes('google')
					? [
							{
								text: 'Continue with Google',
								onPress: () => freshSignIn.mutate({ startedFor, reauth }),
							},
						]
					: []),
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

			{codeFor && (
				<EmailCodeForm
					fixedEmail={codeFor.email}
					initialSentTo={codeFor.email}
					onCancel={() => setCodeFor(undefined)}
					onSignedIn={() => confirmCode(codeFor)}
				/>
			)}

			{freshSignIn.isPending && isCancellable && (
				<OutlineButton onPress={cancelHandOff}>Cancel</OutlineButton>
			)}
		</>
	)
}
