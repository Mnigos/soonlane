import { isDefinedError } from '@orpc/client'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { TODOIST_LINK_ERRORS } from '@soonlane/auth'
import { Button } from '@soonlane/ui/components/button'
import { Skeleton } from '@soonlane/ui/components/skeleton'
import { useQuery } from '@tanstack/react-query'
import { NotFound } from '@/components/not-found'
import { TODOIST_COPY } from '../helpers/todoist-copy.constants'
import { useCancelTodoistMutation } from '../hooks/use-cancel-todoist-mutation'
import { useConnectTodoistMutation } from '../hooks/use-connect-todoist-mutation'
import { useImportTodoistMutation } from '../hooks/use-import-todoist-mutation'
import { TodoistPreviewSummary } from './todoist-preview-summary'

const LINK_ERROR_COPY: Record<string, string> = {
	[TODOIST_LINK_ERRORS.denied]: TODOIST_COPY.denied,
	[TODOIST_LINK_ERRORS.alreadyUsed]: TODOIST_COPY.alreadyUsed,
}

interface TodoistImportPageProps {
	/** Better Auth's `?error=` when Todoist sent the browser back without a link. */
	linkError?: string
}

/** Connects Todoist and shows what an import would bring in; a live connection is read once when the page opens. */
export function TodoistImportPage({
	linkError,
}: Readonly<TodoistImportPageProps>) {
	const status = useQuery(orpcQuery.todoist.status.queryOptions())
	const isConnected = status.data?.connected === true && !linkError
	const preview = useQuery(
		orpcQuery.todoist.preview.queryOptions({
			enabled: isConnected,
			staleTime: Number.POSITIVE_INFINITY,
		})
	)
	const connect = useConnectTodoistMutation()
	const cancel = useCancelTodoistMutation()
	const importTodoist = useImportTodoistMutation()
	const isBusy =
		connect.isPending ||
		connect.isSuccess ||
		cancel.isPending ||
		importTodoist.isPending ||
		importTodoist.isSuccess
	const previewErrorCode = isDefinedError(preview.error)
		? preview.error.code
		: undefined
	const importErrorCode = isDefinedError(importTodoist.error)
		? importTodoist.error.code
		: undefined

	if (status.data?.configured === false) return <NotFound />

	function renderAction(label: string) {
		return (
			<Button disabled={isBusy} onClick={() => connect.mutate()}>
				{label}
			</Button>
		)
	}

	function renderBody() {
		if (status.isError)
			return (
				<p className="text-sm text-danger" role="alert">
					{TODOIST_COPY.statusFailed}
				</p>
			)

		if (importTodoist.isError)
			return (
				<>
					<p className="text-sm text-danger" role="alert">
						{importErrorCode === 'GONE'
							? TODOIST_COPY.expired
							: TODOIST_COPY.importFailed}
					</p>

					{renderAction(TODOIST_COPY.connectAgain)}
				</>
			)

		if (status.isPending || (isConnected && preview.isPending))
			return (
				<div className="flex flex-col gap-2" aria-busy>
					{isConnected && (
						<p className="text-sm text-muted-foreground">
							{TODOIST_COPY.loading}
						</p>
					)}

					<Skeleton className="h-5 w-64" />
				</div>
			)

		if (linkError)
			return (
				<>
					<p className="text-sm text-danger" role="alert">
						{LINK_ERROR_COPY[linkError] ?? TODOIST_COPY.linkFailed}
					</p>

					{renderAction(TODOIST_COPY.introContinue)}
				</>
			)

		if (isConnected && preview.data)
			return (
				<>
					<TodoistPreviewSummary preview={preview.data} />

					{preview.data.tasks > 0 && (
						<Button
							disabled={isBusy}
							onClick={() =>
								importTodoist.mutate({
									timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
								})
							}
						>
							{importTodoist.isPending
								? TODOIST_COPY.importing
								: TODOIST_COPY.confirm}
						</Button>
					)}
				</>
			)

		if (isConnected && previewErrorCode === 'GONE')
			return (
				<>
					<p className="text-sm text-danger" role="alert">
						{TODOIST_COPY.expired}
					</p>

					{renderAction(TODOIST_COPY.connectAgain)}
				</>
			)

		// A connection the sweep already closed shows the start again.
		if (isConnected && previewErrorCode !== 'NOT_FOUND')
			return (
				<>
					<p className="text-sm text-danger" role="alert">
						{TODOIST_COPY.readFailed}
					</p>

					{renderAction(TODOIST_COPY.retry)}
				</>
			)

		return (
			<>
				<p className="text-sm text-secondary-foreground">
					{TODOIST_COPY.introBody}
				</p>

				{renderAction(TODOIST_COPY.introContinue)}
			</>
		)
	}

	return (
		<main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-6 pt-1 pb-24 md:px-10 md:pt-4">
			<h1 className="text-xl font-bold">
				{preview.data ? TODOIST_COPY.previewTitle : TODOIST_COPY.introTitle}
			</h1>

			<div className="flex flex-col items-start gap-4">{renderBody()}</div>

			{connect.error && (
				<p className="text-sm text-danger" role="alert">
					{connect.error.message}
				</p>
			)}

			<div>
				<Button
					disabled={isBusy}
					onClick={() => cancel.mutate()}
					variant="ghost"
				>
					{TODOIST_COPY.cancel}
				</Button>
			</div>
		</main>
	)
}
