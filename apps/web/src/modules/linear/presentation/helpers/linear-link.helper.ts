import { LINEAR_COPY } from '@soonlane/app/linear/helpers/linear-copy.constants'
import { orpcQuery } from '@soonlane/app/rpc-query'
import {
	LINEAR_CONNECT_PATH,
	LINEAR_PROVIDER_ID,
	LINK_ERRORS,
} from '@soonlane/auth'
import { linkAccount } from '@soonlane/auth/client'
import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

/** What `/linear` reads from its URL: `returned` once Linear sent the browser back, with Better Auth's `error` when nothing was linked. */
export interface LinearLinkSearch {
	error?: string
	returned?: boolean
}

const LINK_ERROR_COPY: Record<string, string> = {
	[LINK_ERRORS.denied]: LINEAR_COPY.errorCancelled,
	[LINK_ERRORS.alreadyUsed]: LINEAR_COPY.errorTaken,
}

async function readStatus(queryClient: QueryClient) {
	try {
		return await queryClient.query({
			...orpcQuery.linear.status.queryOptions(),
			staleTime: 0,
		})
	} catch {
		return undefined
	}
}

/** A lapsed connection is closed first, so the new link replaces it; `true` once the browser is on its way to Linear's consent screen. */
async function startLink(closeLapsed: boolean) {
	try {
		if (closeLapsed) await orpcQuery.linear.disconnect.call()

		const { error } = await linkAccount(
			LINEAR_PROVIDER_ID,
			`${LINEAR_CONNECT_PATH}?returned=true`
		)

		return !error
	} catch {
		return false
	}
}

/**
 * The `/linear` page's whole job, run once in the browser: back from Linear it toasts how the link ended, and otherwise it starts the link unless Linear is already connected.
 * `true` once the browser is leaving for Linear; otherwise the page goes on to Upcoming, whose toaster shows what was toasted here.
 */
export async function runLinearLink(
	queryClient: QueryClient,
	{ error, returned }: Readonly<LinearLinkSearch>
) {
	const status = await readStatus(queryClient)

	if (returned) {
		if (error) toast(LINK_ERROR_COPY[error] ?? LINEAR_COPY.errorConnect)
		else if (status?.state === 'connected') toast(LINEAR_COPY.toastConnected)
		else toast(LINEAR_COPY.errorConnect)

		return false
	}
	if (status?.state === 'connected' || status?.state === 'notConfigured')
		return false
	if (status && (await startLink(status.state === 'lapsed'))) return true

	toast(LINEAR_COPY.errorConnect)

	return false
}
