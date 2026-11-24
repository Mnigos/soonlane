import type { LinearIssue, Task } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Tooltip } from '@soonlane/ui/components/tooltip'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useHostApp } from '../../../hooks/use-host-app'
import { orpcQuery } from '../../../rpc-query.client'
import { CHIP_ICON_STROKE } from '../../tasks/helpers/composer-chip.constants'
import { LINEAR_COPY } from '../helpers/linear-copy.constants'
import { useLinearPinMutations } from '../hooks/use-linear-pin-mutations'
import { LinearStatusIcon } from './linear-status-icon'

interface LinearPinsProps {
	task: Task
}

/**
 * The edit card's pinned issues: each chip opens the issue in Linear and has an × to unpin it. Status and title are read
 * live, in one request for all of them; without Linear the stored title shows with a grey ring, and a lapsed or missing
 * connection offers Reconnect.
 */
export function LinearPins({ task }: Readonly<LinearPinsProps>) {
	const { linearConnectHref } = useHostApp()
	const { unpin } = useLinearPinMutations()
	const ids = task.linearPins.map(({ issueId }) => issueId)
	const { data, isError } = useQuery(
		orpcQuery.linear.listIssues.queryOptions({
			input: { ids },
			enabled: ids.length > 0,
		})
	)
	const isConnected = data?.state === 'connected'
	const liveById = new Map<string, LinearIssue>(
		isConnected ? data.issues.map(issue => [issue.issueId, issue]) : []
	)
	const needsReconnect =
		data?.state === 'lapsed' || data?.state === 'notConnected'

	if (ids.length === 0) return null

	return (
		<>
			<ul className="mt-2.5 mb-1 flex flex-wrap gap-1.5">
				{task.linearPins.map(pin => {
					const live = liveById.get(pin.issueId)
					const icon = <LinearStatusIcon state={live?.state} />

					return (
						<li
							className="group flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-md border pr-1.5 pl-2 text-label text-secondary-foreground transition-colors focus-within:bg-hover hover:bg-hover"
							key={pin.issueId}
						>
							<a
								className="flex min-w-0 items-center gap-1.5 outline-none focus-visible:underline"
								href={pin.url}
								rel="noreferrer"
								target="_blank"
							>
								{live || (!data && !isError) ? (
									icon
								) : (
									<Tooltip
										label={
											needsReconnect
												? LINEAR_COPY.reconnectTooltip
												: LINEAR_COPY.statusUnavailable
										}
									>
										<span className="flex">{icon}</span>
									</Tooltip>
								)}

								<span className="shrink-0 tabular-nums">{pin.identifier}</span>

								<span
									className={cn(
										'ph-mask max-w-48 truncate',
										live && 'text-foreground'
									)}
								>
									{live?.title ?? pin.title}
								</span>
							</a>

							{needsReconnect && (
								<a
									className="shrink-0 text-caption text-primary-text hover:underline focus-visible:underline"
									href={linearConnectHref}
								>
									{LINEAR_COPY.reconnect}
								</a>
							)}

							<button
								aria-label={LINEAR_COPY.unpinLabel.replace(
									'{id}',
									pin.identifier
								)}
								className="flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-faint-foreground opacity-0 transition-colors group-focus-within:opacity-100 group-hover:opacity-100 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
								disabled={unpin.isPending}
								onClick={() =>
									unpin.mutate({ id: task.id, issueId: pin.issueId })
								}
								type="button"
							>
								<X
									aria-hidden
									className="size-3"
									strokeWidth={CHIP_ICON_STROKE}
								/>
							</button>
						</li>
					)
				})}
			</ul>

			{unpin.isError && (
				<p className="mb-1 text-caption text-danger" role="alert">
					{LINEAR_COPY.unpinFailed}
				</p>
			)}
		</>
	)
}
