import { QueryClient } from '@tanstack/react-query'
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router'
import { load } from 'cheerio'
import { renderToStaticMarkup } from 'react-dom/server'
import { orpcQuery } from '@/lib/orpc/rpc-query.client'
import { Route } from './__root'

test('renders the noindex policy and the English document', async () => {
	const queryClient = new QueryClient()
	const router = createRouter({
		routeTree: Route,
		history: createMemoryHistory({ initialEntries: ['/'] }),
		context: { queryClient, orpc: orpcQuery },
	})
	await router.load()
	const $ = load(renderToStaticMarkup(<RouterProvider router={router} />))
	expect($('html').attr('lang')).toBe('en')
	expect($('head title').text()).toBe('Soonlist')
	expect($('head meta[name="robots"]').attr('content')).toBe(
		'noindex, nofollow'
	)
})
