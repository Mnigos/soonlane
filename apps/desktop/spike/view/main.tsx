/** SPIKE SOON-141: the bundled page. Not production code. */
import './styles.css'
import { RPCLink } from '@orpc/client/fetch'
import { HostAppContext } from '@soonlane/app/host-app'
import { provideRpcLink } from '@soonlane/app/rpc-query'
import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { TodayPage } from '@soonlane/app/tasks/components/today-page'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { getToday } from '@soonlane/domain'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { Electroview } from 'electrobun/view'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import type { SpikeRpc } from './rpc-schema'

const API = import.meta.env.VITE_API_URL as string
const rpc = Electroview.defineRPC<SpikeRpc>({
	handlers: { requests: {}, messages: {} },
})
new Electroview({ rpc })
const report = (step: string, data: unknown) => rpc.send.report({ step, data })

/** What a fetch from this page gets back, without throwing. */
async function probe(name: string, init: RequestInit) {
	try {
		const response = await fetch(`${API}/api/rpc/identity/me`, {
			method: 'POST',
			...init,
			headers: { 'content-type': 'application/json', ...init.headers },
			body: '{}',
		})
		const body = (await response.json()) as {
			json?: { user?: { name?: string } | null }
		}
		report(`probe:${name}`, {
			status: response.status,
			user: body.json?.user?.name ?? null,
		})
	} catch (error) {
		report(`probe:${name}`, { failed: String(error) })
	}
}

async function start() {
	report('environment', {
		href: location.href,
		origin: self.origin,
		isSecureContext,
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		date: new Date().toString(),
		getToday: getToday(new Date()),
		cookieWritable: (() => {
			document.cookie = 'spike=1'
			return document.cookie.includes('spike=1')
		})(),
		localStorage: (() => {
			try {
				localStorage.setItem('spike', '1')
				return localStorage.getItem('spike') === '1'
			} catch (error) {
				return String(error)
			}
		})(),
	})

	const token = await rpc.request.getSessionToken()
	report('token', { received: token !== null, length: token?.length })
	if (!token) return

	const authorization = `Bearer ${token}`
	await probe('bearer, credentials omit', {
		credentials: 'omit',
		headers: { authorization },
	})
	await probe('bearer, credentials include', {
		credentials: 'include',
		headers: { authorization },
	})
	await probe('no token', { credentials: 'omit' })

	provideRpcLink(
		new RPCLink({
			url: `${API}/api/rpc`,
			headers: () => ({ authorization }),
			fetch: async (url, init) =>
				await fetch(url, { ...init, credentials: 'omit' }),
		})
	)

	const queryClient = new QueryClient()
	queryClient.getQueryCache().subscribe(event => {
		if (event.type !== 'updated' || event.action.type !== 'success') return
		report('query', { key: JSON.stringify(event.query.queryKey).slice(0, 160) })
		setTimeout(
			() => report('dom', document.querySelector('main')?.innerText ?? null),
			300
		)
	})

	const rootRoute = createRootRoute()
	const todayRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: '/app/today',
		component: function TodayRoute() {
			const today = useToday()
			if (!today) return <TaskListSkeleton />
			return <TodayPage today={today} />
		},
	})
	const router = createRouter({
		routeTree: rootRoute.addChildren([todayRoute]),
		history: createMemoryHistory({ initialEntries: ['/app/today'] }),
	})

	createRoot(document.getElementById('root') as HTMLElement).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<HostAppContext
					value={{
						renderUserMenu: () => null,
						homePath: '/app/upcoming',
						appVersion: 'spike',
						appCommit: 'spike',
						releaseNotesUrl: 'https://soonlane.com/changelog',
					}}
				>
					<RouterProvider router={router} />
				</HostAppContext>
			</QueryClientProvider>
		</StrictMode>
	)
}

start().catch(error => report('error', String(error)))
