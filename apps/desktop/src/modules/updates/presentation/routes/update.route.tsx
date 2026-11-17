import { APP_PATHS } from '@soonlane/app/app-paths'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { sendToDesktopHost } from '@soonlane/app/shell/helpers/desktop-host.helper'
import { createRoute, redirect } from '@tanstack/react-router'
import { rootRoute } from '../../../../routes/root.route'
import { UpdateRequiredScreen } from '../components/update-required-screen'

/** The desktop app's own screen, outside `APP_PATHS`, which both host apps serve. */
const UPDATE_PATH = '/update'

export const updateRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: UPDATE_PATH,
	component: UpdateRequiredScreen,
})

/** Every screen but the update one: an app the API no longer serves goes there first. */
export const supportedRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: 'supported',
	beforeLoad: async ({ context, location }) => {
		const { isSupported } = await context.queryClient.query(
			orpcQuery.system.desktopSupport.queryOptions({
				input: { version: import.meta.env.APP_VERSION },
				// Once per page: the answer changes only with a deploy.
				staleTime: Number.POSITIVE_INFINITY,
				gcTime: Number.POSITIVE_INFINITY,
				// Offline too, so a failure reaches the no-connection screen instead of pausing here.
				networkMode: 'always',
			})
		)

		if (isSupported) return
		// The small Quick Add window closes; the main window shows the update screen.
		if (location.pathname === APP_PATHS.quickAdd)
			sendToDesktopHost({ type: 'quick-add-done' })

		throw redirect({ to: UPDATE_PATH })
	},
})
