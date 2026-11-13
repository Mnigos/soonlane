import { RPCJsonSerializer } from '@orpc/client'
import { syncDockBadge } from '@soonlane/app/tasks/helpers/dock-badge.helper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHashHistory, createRouter } from '@tanstack/react-router'
import { RouteError } from './components/route-error'
import { rootRoute, sessionRoute, signInRoute } from './routes/session.route'
import { shellRoute } from './routes/shell.route'
import {
	indexRoute,
	quickAddRoute,
	taskViewRoutes,
} from './routes/task-views.route'

const serializer = new RPCJsonSerializer()

/** One client for the page's lifetime; a sign-in or sign-out reloads the page. */
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			queryKeyHashFn: queryKey =>
				JSON.stringify(serializer.serializeJson(queryKey)),
			staleTime: 30_000,
			retry: false,
		},
	},
})

const routeTree = rootRoute.addChildren([
	indexRoute,
	signInRoute,
	quickAddRoute,
	sessionRoute.addChildren([shellRoute.addChildren(taskViewRoutes)]),
])

/** Hash history: `views://` serves files, so a path in the URL would not survive a reload. */
export const router = createRouter({
	routeTree,
	history: createHashHistory(),
	context: { queryClient },
	defaultErrorComponent: RouteError,
	Wrap: ({ children }) => (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	),
})

syncDockBadge(queryClient)

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
