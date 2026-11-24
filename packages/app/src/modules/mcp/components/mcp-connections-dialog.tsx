import { isDefinedError } from '@orpc/client'
import type { McpConnection } from '@soonlane/contracts'
import { DATE_LOCALE } from '@soonlane/domain'
import { Button } from '@soonlane/ui/components/button'
import { CopyField } from '@soonlane/ui/components/copy-field'
import { Dialog } from '@soonlane/ui/components/dialog'
import { Skeleton } from '@soonlane/ui/components/skeleton'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getHostPorts } from '../../../host-ports.client'
import { orpcQuery } from '../../../rpc-query.client'

const LOAD_FAILED = "Couldn't load connected agents. Try again."
const SIGN_OUT_NOTE = "Signing out doesn't disconnect agents."
const EMPTY_STATE =
	'No agents connected. To connect an AI app, paste this address into its connector or MCP settings.'
const SERVER_ADDRESS = 'Server address'
const COPY_BLOCKED =
	"Couldn't copy automatically. Select the address and copy it."
const shortDate = new Intl.DateTimeFormat(DATE_LOCALE, {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
})

function describeDates({ connectedAt, lastUsedAt }: Readonly<McpConnection>) {
	if (!connectedAt) return undefined
	if (!lastUsedAt) return `Connected ${shortDate.format(connectedAt)}`

	return `Connected ${shortDate.format(connectedAt)} · Last used ${shortDate.format(lastUsedAt)}`
}

interface McpConnectionsDialogProps {
	onClose: () => void
}

/** Lists the AI apps that can reach the user's tasks and disconnects one after a confirmation. */
export function McpConnectionsDialog({
	onClose,
}: Readonly<McpConnectionsDialogProps>) {
	const { showToast } = getHostPorts()
	const queryClient = useQueryClient()
	const [confirming, setConfirming] = useState<McpConnection>()
	const connectionsQuery = useQuery(
		orpcQuery.mcp.listConnections.queryOptions()
	)
	const disconnect = useMutation(
		orpcQuery.mcp.disconnect.mutationOptions({
			networkMode: 'always',
			onSuccess: finishDisconnect,
			// The connection is already gone, as when a committed Disconnect's answer was lost: done, not a failure to retry.
			onError: async error => {
				if (isDefinedError(error) && error.code === 'NOT_FOUND')
					await finishDisconnect()
			},
		})
	)

	async function finishDisconnect() {
		if (confirming) showToast(`Disconnected ${confirming.name}`)
		setConfirming(undefined)
		await queryClient.invalidateQueries({
			queryKey: orpcQuery.mcp.listConnections.key(),
		})
	}

	function close() {
		if (!disconnect.isPending) onClose()
	}

	function renderBody() {
		if (connectionsQuery.isPending)
			return <Skeleton aria-busy aria-label="Loading" className="h-5 w-48" />

		if (connectionsQuery.isError)
			return (
				<div className="flex items-center justify-between gap-3">
					<p className="text-sm text-danger" role="alert">
						{LOAD_FAILED}
					</p>

					<Button
						onClick={() => void connectionsQuery.refetch()}
						size="sm"
						variant="outline"
					>
						Try again
					</Button>
				</div>
			)

		const { connections, serverUrl } = connectionsQuery.data

		if (connections.length === 0)
			return (
				<div className="flex flex-col gap-3">
					<p className="text-sm text-secondary-foreground">{EMPTY_STATE}</p>

					<CopyField
						blockedNote={COPY_BLOCKED}
						label={SERVER_ADDRESS}
						value={serverUrl}
					/>
				</div>
			)

		return (
			<ul className="flex min-h-0 flex-col divide-y divide-border overflow-y-auto">
				{connections.map(connection => (
					<li
						className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
						key={connection.id}
					>
						<div className="flex min-w-0 flex-col gap-0.5">
							<p className="text-sm font-semibold">{connection.name}</p>

							<p className="text-caption text-muted-foreground">
								{connection.host ?? 'Unverified app'}
								{' · '}
								{connection.access === 'read-write'
									? 'Can see and edit tasks'
									: 'Can see tasks'}
							</p>

							<p className="text-caption text-muted-foreground">
								{describeDates(connection)}
							</p>
						</div>

						<Button
							className="shrink-0 text-danger"
							disabled={disconnect.isPending}
							onClick={() => {
								disconnect.reset()
								setConfirming(connection)
							}}
							size="sm"
							variant="ghost"
						>
							Disconnect
						</Button>
					</li>
				))}
			</ul>
		)
	}

	return (
		<Dialog
			className="flex max-h-[calc(100dvh-2rem)] max-w-md flex-col overflow-hidden"
			label="Connected agents"
			onClose={close}
		>
			<div className="flex min-h-0 flex-col gap-5 p-5 wrap-anywhere">
				<h2 className="text-base font-semibold">Connected agents</h2>

				{confirming ? (
					<div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
						<p className="text-sm font-semibold">
							Disconnect {confirming.name}?
						</p>

						<p className="text-sm text-secondary-foreground">
							{confirming.name} loses access to your tasks right away on all
							your devices. You can reconnect anytime from {confirming.name}.
						</p>

						{disconnect.isError && (
							<p className="text-sm font-medium text-danger" role="alert">
								{`Couldn't disconnect ${confirming.name}. Try again.`}
							</p>
						)}
					</div>
				) : (
					renderBody()
				)}

				{confirming ? (
					<div className="flex flex-wrap justify-end gap-2">
						<Button
							disabled={disconnect.isPending}
							onClick={() => setConfirming(undefined)}
							variant="ghost"
						>
							Cancel
						</Button>

						<Button
							className="text-danger"
							disabled={disconnect.isPending}
							onClick={() => disconnect.mutate({ id: confirming.id })}
							variant="outline"
						>
							Disconnect
						</Button>
					</div>
				) : (
					<div className="flex items-center justify-between gap-2">
						<p className="text-caption text-muted-foreground">
							{SIGN_OUT_NOTE}
						</p>

						<Button onClick={onClose} variant="ghost">
							Done
						</Button>
					</div>
				)}
			</div>
		</Dialog>
	)
}
