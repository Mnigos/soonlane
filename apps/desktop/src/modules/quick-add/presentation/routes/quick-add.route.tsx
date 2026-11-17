import { APP_PATHS } from '@soonlane/app/app-paths'
import { sendToDesktopHost } from '@soonlane/app/shell/helpers/desktop-host.helper'
import { QuickAddPage } from '@soonlane/app/tasks/components/quick-add-page'
import { createRoute, redirect } from '@tanstack/react-router'
import { loadSessionUser } from '../../../identity/presentation/helpers/session-user.helper'
import { SIGN_IN_PATH } from '../../../identity/presentation/routes/session.route'
import { supportedRoute } from '../../../updates/presentation/routes/update.route'

/** Its own window; signed out, it asks the main process to close it, and the main window signs in. */
export const quickAddRoute = createRoute({
	getParentRoute: () => supportedRoute,
	path: APP_PATHS.quickAdd,
	beforeLoad: async ({ context }) => {
		if (await loadSessionUser(context.queryClient)) return

		sendToDesktopHost({ type: 'quick-add-done' })
		throw redirect({ to: SIGN_IN_PATH })
	},
	component: QuickAddPage,
})
