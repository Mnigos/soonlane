import {
	isAccountChangedAnswer,
	isRefusedMcpClientRequest,
	readVerifiedMcpClientHost,
} from '@soonlane/auth'
import { answerMcpClientRequest, readMcpClient } from '@soonlane/auth/client'
import { MCP_CLIENT_NAME_FALLBACK } from '@soonlane/domain'
import { Button } from '@soonlane/ui/components/button'
import { Skeleton } from '@soonlane/ui/components/skeleton'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ALLOW_COPY } from '../allow-copy.constants'
import { ALLOW_PAGE_CLASS } from '../allow-page.constants'
import {
	type McpAccess,
	type McpClientRequest,
	readAccessChoice,
	toScope,
} from '../helpers/mcp-client-request.helper'
import { AccessCheckboxes } from './access-checkboxes'
import { AllowNotice } from './allow-notice'
import { RedirectNotice } from './redirect-notice'

/** The repo's link focus style (`privacy-choices-dialog.tsx`), kept on one line. */
const LINK_CLASS =
	'rounded-sm whitespace-nowrap underline underline-offset-4 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

interface AnswerInput {
	signedRequest: string
	/** The account the page showed; the API refuses the answer from a session of another one. */
	userId: string
	/** Absent refuses the agent. */
	scope?: string
}

/** Why the page stopped offering a choice: the request expired, by the server's clock at load or by the provider's answer, or another tab signed in to another account. */
type Interruption = 'expired' | 'account-changed'

async function readMcpClientName(clientId: string) {
	const { data, error } = await readMcpClient(clientId)

	if (error) throw new Error('MCP client not found', { cause: error })

	return data.client_name
}

/** The interruption the API answered with, or nothing once Better Auth's client is taking the browser back to the agent. */
async function answer({
	signedRequest,
	userId,
	scope,
}: Readonly<AnswerInput>): Promise<Interruption | undefined> {
	const { error } = await answerMcpClientRequest(signedRequest, userId, scope)

	if (!error) return undefined
	if (isRefusedMcpClientRequest(error)) return 'expired'
	if (isAccountChangedAnswer(error)) return 'account-changed'

	throw new Error('Answer refused', { cause: error })
}

interface AllowScreenProps {
	request?: McpClientRequest
	/** Decided on the server with its clock at the first load; afterwards only the provider's answer expires the page, so a fast device clock cannot. */
	isExpired: boolean
	access?: McpAccess[]
	userId: string
	email: string
	onAccessChange: (access: McpAccess[]) => void
}

/** Where the user decides what a connecting agent may do with their tasks. */
export function AllowScreen({
	request,
	isExpired,
	access,
	userId,
	email,
	onAccessChange,
}: Readonly<AllowScreenProps>) {
	const clientId = request?.clientId
	const host = readVerifiedMcpClientHost(clientId ?? '')
	const [interruption, setInterruption] = useState<Interruption | undefined>(
		isExpired ? 'expired' : undefined
	)
	const [isAnswered, setIsAnswered] = useState(false)
	const nameQuery = useQuery({
		queryKey: ['mcp-client', clientId],
		queryFn: async () =>
			clientId ? await readMcpClientName(clientId) : undefined,
		enabled: clientId !== undefined && interruption === undefined,
	})
	const answering = useMutation({
		mutationFn: answer,
		onSuccess: setInterruption,
	})
	const name = nameQuery.data ?? host ?? MCP_CLIENT_NAME_FALLBACK
	// No choice before the agent's name is known, nor after one was sent.
	const isLocked = isAnswered || nameQuery.isPending
	const { requested, ticked, keepsRefresh } = readAccessChoice(
		request?.requestedScope,
		access
	)

	/** Sends one answer per tab; only an error lets the user answer again. */
	function send(scope?: string) {
		if (!request) return

		// Local state, not the mutation's: React applies it before the next click, while the mutation reports pending only after a task.
		setIsAnswered(true)
		answering.mutate(
			{ signedRequest: request.signedRequest, userId, scope },
			{ onError: () => setIsAnswered(false) }
		)
	}

	/** The page without a choice to offer: interrupted, without a request, or without the agent's name. */
	function renderNotice() {
		if (interruption === 'account-changed')
			return (
				<AllowNotice
					actionLabel={ALLOW_COPY.accountChangedButton}
					message={ALLOW_COPY.accountChanged}
					onAction={() => window.location.reload()}
				/>
			)

		if (!request || !clientId || interruption === 'expired')
			return <AllowNotice message={ALLOW_COPY.expired(name)} />

		// A retry of a failed lookup is pending, not failed, and keeps the notice with its button disabled.
		if (nameQuery.errorUpdateCount > 0 && !nameQuery.isSuccess)
			return (
				<AllowNotice
					actionLabel={ALLOW_COPY.retryButton}
					isActionDisabled={nameQuery.isFetching}
					message={ALLOW_COPY.loadFailed}
					onAction={() => void nameQuery.refetch()}
				/>
			)

		return undefined
	}

	const notice = renderNotice()

	// Without a request there is always a notice; the check only tells the compiler.
	if (notice || !request) return notice

	return (
		<main className={ALLOW_PAGE_CLASS}>
			<div className="flex flex-col gap-1.5">
				{nameQuery.isPending ? (
					<Skeleton aria-busy aria-label="Loading" className="h-8 w-64" />
				) : (
					<h1 className="text-2xl font-bold tracking-tight">
						{ALLOW_COPY.title(name)}
					</h1>
				)}

				<p className="text-sm text-muted-foreground">
					{host ? ALLOW_COPY.verifiedLine(host) : ALLOW_COPY.unverifiedLine}
				</p>

				<p className="text-sm text-muted-foreground">
					<span className="ph-mask">{ALLOW_COPY.accountLine(email)}</span>
					{' · '}
					<a className={LINK_CLASS} href={request.signInAgainUrl}>
						{ALLOW_COPY.switchAccountLink}
					</a>
				</p>
			</div>

			{requested.length === 0 ? (
				<p className="text-sm font-medium">
					{ALLOW_COPY.nothingRequested(name)}
				</p>
			) : (
				<AccessCheckboxes
					isDisabled={isLocked}
					onChange={onAccessChange}
					requested={requested}
					ticked={ticked}
				/>
			)}

			<div className="flex flex-col gap-1.5 text-sm text-secondary-foreground">
				<RedirectNotice redirectUri={request.redirectUri} />

				<p className="text-muted-foreground">{ALLOW_COPY.footer(name)}</p>
			</div>

			<div className="flex flex-col items-end gap-2">
				<div className="flex gap-2">
					<Button disabled={isLocked} onClick={() => send()} variant="ghost">
						{ALLOW_COPY.cancelButton}
					</Button>

					{requested.length > 0 && (
						<Button
							disabled={isLocked || ticked.length === 0}
							onClick={() => send(toScope(ticked, keepsRefresh))}
						>
							{ALLOW_COPY.allowButton}
						</Button>
					)}
				</div>

				{requested.length > 0 && ticked.length === 0 && (
					<p className="text-caption text-muted-foreground">
						{ALLOW_COPY.nothingTickedHint}
					</p>
				)}
			</div>

			{answering.isError && (
				<p className="text-sm font-medium text-danger" role="alert">
					{ALLOW_COPY.answerFailed}
				</p>
			)}
		</main>
	)
}
