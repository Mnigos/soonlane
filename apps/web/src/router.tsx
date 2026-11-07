import type { RPCJsonSerialization } from '@orpc/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { NotFound } from './components/not-found'
import {
	captureException,
	trackRouter,
} from './modules/analytics/presentation/analytics.client'
import { orpcQuery } from './platform/rpc/rpc-query.client'
import { serializer } from './platform/rpc/rpc-serializer.constants'
import { routeTree } from './routeTree.gen'

export interface RouterContext {
	queryClient: QueryClient
	orpc: typeof orpcQuery
}

function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: queryKey =>
					JSON.stringify(serializer.serialize(queryKey)),
				staleTime: 30_000,
				retry: false,
			},
			dehydrate: {
				shouldDehydrateQuery: query => query.state.status === 'success',
				serializeData: data => serializer.serialize(data),
			},
			hydrate: {
				deserializeData: (data: RPCJsonSerialization) =>
					serializer.deserialize(data),
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
		defaultNotFoundComponent: NotFound,
		defaultOnCatch: captureException,
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
	})

	setupRouterSsrQueryIntegration({ router, queryClient })
	trackRouter(router)

	return router
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof getRouter>
	}
}
