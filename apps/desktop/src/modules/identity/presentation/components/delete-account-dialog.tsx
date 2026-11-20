import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
import { useMutation } from '@tanstack/react-query'
import {
	type AccountDeletion,
	type DeletingAccount,
	desktopHost,
} from '../../../../platform/rpc/desktop-host.client'
import { SIGN_IN_COPY } from '../helpers/sign-in-copy.constants'
import { useSignInStatus } from '../hooks/use-sign-in-status'
import { AccountNotDeletedDialog } from './account-not-deleted-dialog'
import { DeletionNotConfirmedDialog } from './deletion-not-confirmed-dialog'

const DELETE_ACCOUNT_FAILED = 'Could not delete the account. Try again.'
const FRESH_SIGN_IN_REQUIRED =
	'For your safety, sign in again to delete your account.'
const GOOGLE_SIGN_OUT_REQUIRED =
	'For your safety, deleting your account requires a fresh sign-in where Google verifies you. Sign out of Google in your default browser first, then press "Continue in browser".'
const GOOGLE_SKIPPED_VERIFYING =
	'For your safety, deleting your account requires a fresh sign-in, and Google skipped verifying you. Press "Continue in browser" to use an email code, or sign out of Google in your default browser first to use Google.'

type NeedsFreshSignIn = Extract<
	AccountDeletion,
	{ status: 'needs-fresh-sign-in' }
>

/** A stale Google login comes back unverified from Google again, so the text says how to get past it. */
function readFreshSignInCopy({
	isGoogleLoginStale,
	reauth,
}: Pick<NeedsFreshSignIn, 'isGoogleLoginStale' | 'reauth'>) {
	if (!isGoogleLoginStale) return FRESH_SIGN_IN_REQUIRED

	return reauth.includes('email')
		? GOOGLE_SKIPPED_VERIFYING
		: GOOGLE_SIGN_OUT_REQUIRED
}

interface DeleteAccountDialogProps {
	account: DeletingAccount
	onClose: () => void
}

/**
 * The web app's deletion dialog for the desktop app. The main process deletes
 * only while its token is still this account's. A session too old to delete
 * from asks for a fresh sign-in in the system browser; the page that loads
 * with its token opens this dialog again, with nothing deleted yet.
 */
export function DeleteAccountDialog({
	account,
	onClose,
}: Readonly<DeleteAccountDialogProps>) {
	const signInStatus = useSignInStatus()
	const {
		mutate: deleteAccount,
		data,
		isPending,
		error,
	} = useMutation({
		mutationFn: async () => await desktopHost.deleteAccount(account.id),
	})
	const { mutate: signInAgain, isPending: isOpeningBrowser } = useMutation({
		mutationFn: async () => await desktopHost.signInToDelete(account),
	})

	if (data?.status === 'signed-in-as')
		return (
			<AccountNotDeletedDialog
				onClose={onClose}
				signedInAs={data.email}
				startedFor={account.email}
			/>
		)

	if (data?.status === 'signed-out')
		return <DeletionNotConfirmedDialog email={account.email} />

	const needsFreshSignIn = data?.status === 'needs-fresh-sign-in'
	// The page reloads signed out once the main process forgets the token.
	const isDeleting = isPending || data?.status === 'deleted'
	// A dialog closed mid-deletion would drop the result the user has to see.
	const closeUnlessPending = () => {
		if (!isPending) onClose()
	}

	return (
		<Dialog
			className="max-w-md"
			label="Delete account"
			onClose={closeUnlessPending}
		>
			<div className="flex flex-col gap-5 p-5">
				<div className="flex flex-col gap-1.5">
					<h2 className="text-base font-semibold">Delete your account?</h2>

					<p className="text-sm text-muted-foreground">
						This deletes <span className="ph-mask">{account.email}</span> and
						all its tasks right away. It cannot be undone.
					</p>
				</div>

				{needsFreshSignIn && (
					<div className="flex flex-col gap-3">
						<p className="text-sm font-medium" role="alert">
							{readFreshSignInCopy(data)}
						</p>

						<Button
							disabled={isOpeningBrowser}
							onClick={() => signInAgain()}
							size="lg"
							variant="outline"
						>
							{SIGN_IN_COPY.continue}
						</Button>

						{signInStatus === 'waiting' && (
							<output className="text-sm text-muted-foreground">
								{SIGN_IN_COPY.waiting}
							</output>
						)}

						{signInStatus === 'failed' && (
							<p className="text-sm font-medium text-danger" role="alert">
								{SIGN_IN_COPY.failed}
							</p>
						)}
					</div>
				)}

				{error && (
					<p className="text-sm font-medium text-danger" role="alert">
						{DELETE_ACCOUNT_FAILED}
					</p>
				)}

				<div className="flex justify-end gap-2">
					<Button disabled={isPending} onClick={onClose} variant="ghost">
						Cancel
					</Button>

					{!needsFreshSignIn && (
						<Button
							disabled={isDeleting}
							onClick={() => deleteAccount()}
							variant="destructive"
						>
							{isDeleting ? 'Deleting…' : 'Delete account'}
						</Button>
					)}
				</div>
			</div>
		</Dialog>
	)
}
