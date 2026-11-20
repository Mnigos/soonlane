import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'

const ACCOUNT_NOT_DELETED = 'Account not deleted'

interface AccountNotDeletedDialogProps {
	/** The address of the account the token now belongs to. */
	signedInAs: string
	/** The address of the account the deletion was started for. */
	startedFor: string
	onClose: () => void
}

/** Nothing was deleted, because the app is signed in to another account than the one the deletion was started for, and no deletion is offered. */
export function AccountNotDeletedDialog({
	signedInAs,
	startedFor,
	onClose,
}: Readonly<AccountNotDeletedDialogProps>) {
	return (
		<Dialog className="max-w-md" label={ACCOUNT_NOT_DELETED} onClose={onClose}>
			<div className="flex flex-col gap-5 p-5">
				<div className="flex flex-col gap-1.5">
					<h2 className="text-base font-semibold">{ACCOUNT_NOT_DELETED}</h2>

					<p className="text-sm text-muted-foreground">
						You are now signed in as{' '}
						<span className="ph-mask">{signedInAs}</span>, and{' '}
						<span className="ph-mask">{startedFor}</span> was not deleted. To
						delete <span className="ph-mask">{startedFor}</span>, sign out and
						sign in with that account.
					</p>
				</div>

				<div className="flex justify-end">
					<Button onClick={onClose}>OK</Button>
				</div>
			</div>
		</Dialog>
	)
}
