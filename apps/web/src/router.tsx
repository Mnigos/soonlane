import type { RPCJsonSerialization } from '@orpc/client'
import { captureException, trackRouter } from '@soonlane/analytics/client'
import { orpcQuery, provideRpcLink } from '@soonlane/app/rpc-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { NotFound } from './components/not-found'
import { RouteError } from './components/route-error'
import { BROWSER_ANALYTICS_OPTIONS } from './modules/analytics/presentation/browser-analytics.constants'
import { syncDockBadge } from './modules/tasks/presentation/helpers/dock-badge.helper'
import { serializer } from './platform/rpc/rpc-serializer.constants'
import { rpcLink } from './platform/rpc/rpc.client'
import { routeTree } from './routeTree.gen'
import {
	listenForChunkErrors,
	recoverFromChunkError,
} from './utils/stale-chunk.util'

provideRpcLink(rpcLink)

export interface RouterContext {
	queryClient: QueryClient
	orpc: typeof orpcQuery
}

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: queryKey =>
					JSON.stringify(serializer.serializeJson(queryKey)),
				staleTime: 30_000,
				retry: false,
			},
			dehydrate: {
				shouldDehydrateQuery: query => query.state.status === 'success',
				serializeData: data => serializer.serializeJson(data),
			},
			hydrate: {
				deserializeData: (data: RPCJsonSerialization) =>
					serializer.deserializeJson(data),
			},
		},
	})
}

export function getRouter() {
	const queryClient = createQueryClient()

	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		context: { queryClient, orpc: orpcQuery },
		defaultNotFoundComponent: () => <NotFound className="min-h-dvh" />,
		defaultErrorComponent: ({ error }) => (
			<RouteError className="flex-1 py-16" error={error} />
		),
		defaultOnCatch: error => {
			captureException(error)
			void recoverFromChunkError(error)
		},
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	})

	setupRouterSsrQueryIntegration({ router, queryClient })
	trackRouter(router, BROWSER_ANALYTICS_OPTIONS)
	syncDockBadge(queryClient)
	listenForChunkErrors()

	return router
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
