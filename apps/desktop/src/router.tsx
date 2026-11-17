import { RPCJsonSerializer } from '@orpc/client'
import { provideHostPorts } from '@soonlane/app/host-ports'
import { provideRpcLink } from '@soonlane/app/rpc-query'
import { syncDockBadge } from '@soonlane/app/tasks/helpers/dock-badge.helper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createHashHistory, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
	sessionRoute,
	signInRoute,
} from './modules/identity/presentation/routes/session.route'
import { quickAddRoute } from './modules/quick-add/presentation/routes/quick-add.route'
import { RouteError } from './modules/shell/presentation/components/route-error'
import { shellRoute } from './modules/shell/presentation/routes/shell.route'
import { taskViewRoutes } from './modules/tasks/presentation/routes/task-views.route'
import { offerUpdateRestart } from './modules/updates/presentation/helpers/update-ready.helper'
import {
	supportedRoute,
	updateRoute,
} from './modules/updates/presentation/routes/update.route'
import { apiLink } from './platform/rpc/api-link.client'
import { desktopHost } from './platform/rpc/desktop-host.client'
import { rootRoute } from './routes/root.route'

// Before anything below reads them: syncDockBadge checks the host ports while this module loads.
provideRpcLink(apiLink)
provideHostPorts({
	showToast: (message, options) => {
		toast(message, options)
	},
	dismissToast: id => {
		toast.dismiss(id)
	},
	// The desktop app asks for no analytics consent yet, so it sends no events.
	capture: () => undefined,
	subscribeToResume: onResume => {
		document.addEventListener('visibilitychange', onResume)

		return () => document.removeEventListener('visibilitychange', onResume)
	},
	sendToDesktop: desktopHost.sendToMain,
})

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
	updateRoute,
	supportedRoute.addChildren([
		signInRoute,
		quickAddRoute,
		sessionRoute.addChildren([shellRoute.addChildren(taskViewRoutes)]),
	]),
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
offerUpdateRestart()
// Back online, every view loads again without waiting for the next reconnect ping.
window.addEventListener('online', () => void router.invalidate())

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router
	}
}
