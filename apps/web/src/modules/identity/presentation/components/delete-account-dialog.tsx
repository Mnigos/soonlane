import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
import { useRouter } from '@tanstack/react-router'
import { EMAIL_CODE_COPY } from '../email-code-copy.constants'
import {
	DELETE_ACCOUNT_FAILED,
	useDeleteAccountMutation,
} from '../hooks/use-delete-account-mutation'
import { ContinueWithGoogle, SIGN_IN_FAILED } from './continue-with-google'
import { EmailCodeSignIn } from './email-code-sign-in'

const FRESH_SIGN_IN_REQUIRED =
	'For your safety, sign in again to delete your account.'
const GOOGLE_SIGN_OUT_REQUIRED =
	'For your safety, deleting your account requires a fresh sign-in where Google verifies you. Sign out of Google in this browser first, then press "Continue with Google".'

interface DeleteAccountDialogProps {
	email: string
	onClose: () => void
	reauthError?: string
}

export function DeleteAccountDialog({
	email,
	onClose,
	reauthError,
}: Readonly<DeleteAccountDialogProps>) {
	const router = useRouter()
	const { mutate, data, isPending, error } = useDeleteAccountMutation()
	const reopenURL = router.buildLocation({
		to: '.',
		search: { deleteAccount: true },
	}).publicHref
	// The server's latest answer wins over the URL's error, which stays for the whole dialog; a return from Google carries no refusal to read, so it offers Google again.
	const showsReturnError = Boolean(reauthError) && !data && !isPending
	const needsFreshSignIn = data ? data.needsFreshSignIn : showsReturnError
	const reauth = data?.reauth ?? ['google']

	return (
		<Dialog className="max-w-md" label="Delete account" onClose={onClose}>
			<div className="flex flex-col gap-5 p-5">
				<div className="flex flex-col gap-1.5">
					<h2 className="text-base font-semibold">Delete your account?</h2>

					<p className="text-sm text-muted-foreground">
						This deletes <span className="ph-mask">{email}</span> and all its
						tasks right away. It cannot be undone.
					</p>
				</div>

				{needsFreshSignIn && (
					<div className="flex flex-col gap-3">
						<p className="text-sm font-medium" role="alert">
							{data?.isGoogleLoginStale && !reauth.includes('email')
								? GOOGLE_SIGN_OUT_REQUIRED
								: FRESH_SIGN_IN_REQUIRED}
						</p>

						{reauth.includes('email') && (
							<EmailCodeSignIn fixedEmail={email} onSignedIn={() => mutate()} />
						)}

						{reauth.includes('email') && reauth.includes('google') && (
							<p className="text-center text-caption text-faint-foreground">
								{EMAIL_CODE_COPY.divider}
							</p>
						)}

						{reauth.includes('google') && (
							<ContinueWithGoogle
								fresh
								loginHint={email}
								redirects={{
									callbackURL: reopenURL,
									errorCallbackURL: reopenURL,
								}}
							/>
						)}
					</div>
				)}

				{showsReturnError && (
					<p className="text-sm font-medium text-danger" role="alert">
						{SIGN_IN_FAILED}
					</p>
				)}

				{error && (
					<p className="text-sm font-medium text-danger" role="alert">
						{DELETE_ACCOUNT_FAILED}
					</p>
				)}

				<div className="flex justify-end gap-2">
					<Button onClick={onClose} variant="ghost">
						Cancel
					</Button>

					{/* After a failed return from Google, deleting again asks the server which ways back in it offers. */}
					{!data?.needsFreshSignIn && (
						<Button
							disabled={isPending}
							onClick={() => mutate()}
							variant="destructive"
						>
							{isPending ? 'Deleting…' : 'Delete account'}
						</Button>
					)}
				</div>
			</div>
		</Dialog>
	)
}
