import { APP_PATHS } from '@soonlane/app/app-paths'
import { orpcQuery } from '@soonlane/app/rpc-query'
import type { QueryClient } from '@tanstack/react-query'
import {
	createRootRouteWithContext,
	createRoute,
	redirect,
} from '@tanstack/react-router'
import { UpdateRequiredScreen } from '../components/update-required-screen'
import { SignInScreen } from '../modules/identity/components/sign-in-screen'
import { loadSessionUser } from '../modules/identity/helpers/session-user.helper'

export interface RouterContext {
	queryClient: QueryClient
}

/** The desktop app's own screens, outside `APP_PATHS`, which both host apps serve. */
export const SIGN_IN_PATH = '/sign-in'
const UPDATE_PATH = '/update'
export const rootRoute = createRootRouteWithContext<RouterContext>()()

export const updateRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: UPDATE_PATH,
	component: UpdateRequiredScreen,
})

/** Every screen but the update one: an app the API no longer serves goes there first. */
export const supportedRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: 'supported',
	beforeLoad: async ({ context }) => {
		const { isSupported } = await context.queryClient.query(
			orpcQuery.system.desktopSupport.queryOptions({
				input: { version: import.meta.env.APP_VERSION },
				// Once per page: the answer changes only with a deploy.
				staleTime: Number.POSITIVE_INFINITY,
			})
		)

		if (!isSupported) throw redirect({ to: UPDATE_PATH })
	},
})

export const signInRoute = createRoute({
	getParentRoute: () => supportedRoute,
	path: SIGN_IN_PATH,
	beforeLoad: async ({ context }) => {
		if (await loadSessionUser(context.queryClient))
			throw redirect({ to: APP_PATHS.upcoming })
	},
	component: SignInScreen,
})

/** Every view but Quick Add; without a user the window shows the sign-in screen. */
export const sessionRoute = createRoute({
	getParentRoute: () => supportedRoute,
	id: 'session',
	beforeLoad: async ({ context }) => {
		const user = await loadSessionUser(context.queryClient)

		if (!user) throw redirect({ to: SIGN_IN_PATH })

		return { user }
	},
})
