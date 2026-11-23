import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'
import { ALLOW_COPY } from '../allow-copy.constants'
import { AllowScreen } from '../components/allow-screen'
import {
	type McpAccess,
	hasExpiredOnServer,
	readMcpClientRequest,
} from '../helpers/mcp-client-request.helper'

/** The query as the browser sent it; the router's own copy has already parsed values such as `state=1e5` into numbers. */
const getRawQuery = createIsomorphicFn()
	.server(() => new URL(getRequest().url).search)
	.client(() => window.location.search)

/**
 * `request` holds the provider's whole query verbatim. It always starts with `?`, which the router's parser neither reads as a number nor as JSON,
 * so it survives every navigation and reload unchanged; `access` holds the ticked boxes.
 */
const allowSearchSchema = z.object({
	request: z.string().startsWith('?').optional().catch(undefined),
	access: z
		.array(z.enum(['read', 'write']))
		.optional()
		.catch(undefined),
})

export const Route = createFileRoute('/_session/mcp/allow')({
	validateSearch: allowSearchSchema,
	beforeLoad: ({ context, search }) => {
		if (search.request === undefined) {
			const query = getRawQuery()

			if (new URLSearchParams(query).has('sig'))
				throw redirect({
					to: '/mcp/allow',
					search: { request: query },
					replace: true,
				})

			return { isExpired: false }
		}

		const isExpired = hasExpiredOnServer(
			readMcpClientRequest(search.request).expiresAt
		)

		// A document load to the raw query, as the provider's own redirect: the router would rewrite it. The provider returns here after the sign-in.
		if (!(context.me.user || isExpired))
			throw redirect({ href: `/login${search.request}`, reloadDocument: true })

		return { isExpired }
	},
	head: () => ({ meta: [{ title: ALLOW_COPY.pageTitle }] }),
	component: AllowRoute,
})

function AllowRoute() {
	const { me, isExpired } = Route.useRouteContext()
	const { request, access } = Route.useSearch()
	const navigate = useNavigate()

	function setAccess(next: McpAccess[]) {
		void navigate({
			to: '.',
			search: prev => ({ ...prev, access: next }),
			replace: true,
			resetScroll: false,
		})
	}

	return (
		<AllowScreen
			access={access}
			email={me.user?.email ?? ''}
			isExpired={isExpired}
			onAccessChange={setAccess}
			userId={me.user?.id ?? ''}
			request={request && me.user ? readMcpClientRequest(request) : undefined}
		/>
	)
}
