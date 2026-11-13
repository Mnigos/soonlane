import { APP_PATHS } from '@soonlane/app/app-paths'
import type { QueryClient } from '@tanstack/react-query'
import {
	createRootRouteWithContext,
	createRoute,
	redirect,
} from '@tanstack/react-router'
import { SignInScreen } from '../modules/identity/components/sign-in-screen'
import { loadSessionUser } from '../modules/identity/helpers/session-user.helper'

export interface RouterContext {
	queryClient: QueryClient
}

/** The desktop app's own screen, outside `APP_PATHS`, which both host apps serve. */
export const SIGN_IN_PATH = '/sign-in'
export const rootRoute = createRootRouteWithContext<RouterContext>()()

export const signInRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: SIGN_IN_PATH,
	beforeLoad: async ({ context }) => {
		if (await loadSessionUser(context.queryClient))
			throw redirect({ to: APP_PATHS.upcoming })
	},
	component: SignInScreen,
})

/** Every view but Quick Add; without a user the window shows the sign-in screen. */
export const sessionRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: 'session',
	beforeLoad: async ({ context }) => {
		const user = await loadSessionUser(context.queryClient)

		if (!user) throw redirect({ to: SIGN_IN_PATH })

		return { user }
	},
})
