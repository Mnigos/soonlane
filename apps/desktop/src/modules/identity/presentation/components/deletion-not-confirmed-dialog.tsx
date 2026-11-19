import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
import { useMutation } from '@tanstack/react-query'
import { desktopHost } from '../../../../platform/rpc/desktop-host.client'
import { SIGN_OUT_FAILED } from '../helpers/sign-out-copy.constants'

const DELETION_NOT_CONFIRMED = 'Deletion not confirmed'

interface DeletionNotConfirmedDialogProps {
	/** The address of the account the deletion was started for. */
	email: string
}

/**
 * The app cannot tell whether the account was deleted: the server has no
 * session for the token, or the deletion and the check after it got no
 * readable reply. Closing the dialog any way signs out, landing on the sign-in
 * screen, from where the user can sign in and delete again; a failed sign-out
 * keeps it open.
 */
export function DeletionNotConfirmedDialog({
	email,
}: Readonly<DeletionNotConfirmedDialogProps>) {
	const {
		mutate: signOut,
		isPending,
		error,
	} = useMutation({ mutationFn: desktopHost.signOut })
	const signOutUnlessPending = () => {
		if (!isPending) signOut()
	}

	return (
		<Dialog
			className="max-w-md"
			label={DELETION_NOT_CONFIRMED}
			onClose={signOutUnlessPending}
		>
			<div className="flex flex-col gap-5 p-5">
				<div className="flex flex-col gap-1.5">
					<h2 className="text-base font-semibold">{DELETION_NOT_CONFIRMED}</h2>

					<p className="text-sm text-muted-foreground">
						Soonlane couldn&apos;t confirm whether{' '}
						<span className="ph-mask">{email}</span> was deleted. If you still
						want to delete <span className="ph-mask">{email}</span>, sign in
						again and click your name in the sidebar to delete it.
					</p>
				</div>

				{error && (
					<p className="text-sm font-medium text-danger" role="alert">
						{SIGN_OUT_FAILED}
					</p>
				)}

				<div className="flex justify-end">
					<Button disabled={isPending} onClick={() => signOut()}>
						{isPending ? 'Signing out…' : 'Sign out'}
					</Button>
				</div>
			</div>
		</Dialog>
	)
}
