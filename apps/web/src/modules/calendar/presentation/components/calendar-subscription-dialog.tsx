import { capture } from '@soonlane/analytics/client'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { describeFailure } from '@soonlane/app/shell/helpers/maintenance.helper'
import { DATE_LOCALE } from '@soonlane/domain'
import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
import { Skeleton } from '@soonlane/ui/components/skeleton'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CalendarLinkField } from './calendar-link-field'

const createdDate = new Intl.DateTimeFormat(DATE_LOCALE, {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
})

interface CalendarSubscriptionDialogProps {
	onClose: () => void
}

/** Creates, shows once, replaces and revokes the private link that puts open tasks in a calendar app. It stays open while a link is being created, since that link is shown only once. */
export function CalendarSubscriptionDialog({
	onClose,
}: Readonly<CalendarSubscriptionDialogProps>) {
	const queryClient = useQueryClient()
	const [isConfirmingRevoke, setIsConfirmingRevoke] = useState(false)
	const subscriptionQuery = useQuery(
		orpcQuery.calendar.getSubscription.queryOptions()
	)
	const subscription = subscriptionQuery.data?.subscription
	const refreshSubscription = async () =>
		await queryClient.invalidateQueries({
			queryKey: orpcQuery.calendar.getSubscription.key(),
		})
	const create = useMutation(
		orpcQuery.calendar.createSubscription.mutationOptions({
			gcTime: 0,
			networkMode: 'always',
			onMutate: () => ({ replaced: subscription !== undefined }),
			onSuccess: async (_output, _input, context) => {
				capture('calendar_subscription_created', {
					replaced: context.replaced,
				})
				await refreshSubscription()
			},
		})
	)
	const revoke = useMutation(
		orpcQuery.calendar.revokeSubscription.mutationOptions({
			networkMode: 'always',
			onSuccess: async () => {
				capture('calendar_subscription_revoked', {})
				setIsConfirmingRevoke(false)
				await refreshSubscription()
			},
		})
	)
	const isBusy = create.isPending || revoke.isPending

	function createLink() {
		revoke.reset()
		create.mutate()
	}

	function close() {
		if (!isBusy) onClose()
	}

	function renderBody() {
		if (create.data)
			return (
				<>
					<CalendarLinkField url={create.data.url} />

					<p className="text-sm text-muted-foreground">
						This is the only time the link is shown. To see it again, create a
						new one.
					</p>
				</>
			)

		if (subscriptionQuery.isPending)
			return <Skeleton aria-busy aria-label="Loading" className="h-5 w-48" />

		if (subscriptionQuery.isError)
			return (
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm text-danger" role="alert">
						Could not load your calendar link.
					</p>

					<Button
						onClick={() => void subscriptionQuery.refetch()}
						size="sm"
						variant="outline"
					>
						Try again
					</Button>
				</div>
			)

		if (subscription)
			return (
				<p className="text-sm text-secondary-foreground">
					Link created {createdDate.format(subscription.createdAt)}. Revoking it
					or creating a new one stops calendars that use it from updating.
				</p>
			)

		return (
			<p className="text-sm text-secondary-foreground">
				Your open tasks show up on their days in Apple Calendar or any calendar
				app, read-only. Anyone with the link can see them.
			</p>
		)
	}

	return (
		<Dialog className="max-w-md" label="Calendar subscription" onClose={close}>
			<div className="flex flex-col gap-5 p-5">
				<h2 className="text-base font-semibold">Calendar subscription</h2>

				{renderBody()}

				{(create.isError || revoke.isError) && (
					<p className="text-sm font-medium text-danger" role="alert">
						{create.isError
							? describeFailure(
									create.error,
									'Could not create the link. Try again.'
								)
							: describeFailure(
									revoke.error,
									'Could not revoke the link. Try again.'
								)}
					</p>
				)}

				{isConfirmingRevoke && !create.data && subscription ? (
					<div className="flex flex-wrap items-center justify-end gap-2">
						<p className="mr-auto text-sm text-secondary-foreground">
							Revoke the link?
						</p>

						<Button
							disabled={revoke.isPending}
							onClick={() => setIsConfirmingRevoke(false)}
							variant="ghost"
						>
							Keep
						</Button>

						<Button
							className="text-danger"
							disabled={revoke.isPending}
							onClick={() => revoke.mutate()}
							variant="outline"
						>
							{revoke.isPending ? 'Revoking…' : 'Revoke'}
						</Button>
					</div>
				) : (
					<div className="flex flex-wrap justify-end gap-2">
						{!create.data && subscription && (
							<Button
								className="mr-auto text-danger"
								disabled={isBusy}
								onClick={() => setIsConfirmingRevoke(true)}
								variant="ghost"
							>
								Revoke link
							</Button>
						)}

						<Button disabled={isBusy} onClick={onClose} variant="ghost">
							{create.data ? 'Done' : 'Cancel'}
						</Button>

						{!create.data && subscriptionQuery.isSuccess && (
							<Button disabled={isBusy} onClick={createLink}>
								{create.isPending && 'Creating…'}
								{!create.isPending &&
									(subscription ? 'Create new link' : 'Create link')}
							</Button>
						)}
					</div>
				)}
			</div>
		</Dialog>
	)
}
