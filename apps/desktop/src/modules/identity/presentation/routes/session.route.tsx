import { APP_PATHS } from '@soonlane/app/app-paths'
import { createRoute, redirect } from '@tanstack/react-router'
import { supportedRoute } from '../../../updates/presentation/routes/update.route'
import { SignInScreen } from '../components/sign-in-screen'
import { loadSessionUser } from '../helpers/session-user.helper'

/** The desktop app's own screen, outside `APP_PATHS`, which both host apps serve. */
export const SIGN_IN_PATH = '/sign-in'

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
