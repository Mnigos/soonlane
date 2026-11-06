import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
import { useLocation } from '@tanstack/react-router'
import { useDeleteAccountMutation } from '../hooks/use-delete-account-mutation'
import { ContinueWithGoogle } from './continue-with-google'

interface DeleteAccountDialogProps {
	onClose: () => void
}

export function DeleteAccountDialog({
	onClose,
}: Readonly<DeleteAccountDialogProps>) {
	const location = useLocation()
	const { mutate, data, isPending, isError } = useDeleteAccountMutation()

	return (
		<Dialog className="max-w-md" label="Delete account" onClose={onClose}>
			<div className="flex flex-col gap-5 p-5">
				<div className="flex flex-col gap-1.5">
					<h2 className="text-base font-semibold">Delete your account?</h2>

					<p className="text-sm text-muted-foreground">
						This deletes your account and all your tasks right away. It cannot
						be undone.
					</p>
				</div>

				{data?.needsFreshSignIn && (
					<div className="flex flex-col gap-3">
						<p className="text-sm font-medium" role="alert">
							For your safety, sign in again to delete your account.
						</p>

						{/* Google returns here; a new session is fresh, so the dialog works again. */}
						<ContinueWithGoogle
							redirects={{
								callbackURL: location.href,
								errorCallbackURL: '/login',
							}}
						/>
					</div>
				)}

				{isError && (
					<p className="text-sm font-medium text-danger" role="alert">
						Could not delete the account. Try again.
					</p>
				)}

				<div className="flex justify-end gap-2">
					<Button onClick={onClose} variant="ghost">
						Cancel
					</Button>

					{!data?.needsFreshSignIn && (
						<Button disabled={isPending} onClick={() => mutate()}>
							{isPending ? 'Deleting…' : 'Delete account'}
						</Button>
					)}
				</div>
			</div>
		</Dialog>
	)
}
