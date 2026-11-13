import { APP_PATHS } from '@soonlane/app/app-paths'
import { HostAppContext } from '@soonlane/app/host-app'
import { Shell } from '@soonlane/app/shell/components/shell'
import { readNoDateSectionOpen } from '@soonlane/app/shell/helpers/no-date-section-preference.helper'
import { readSidebarPreference } from '@soonlane/app/shell/helpers/sidebar-preference.helper'
import {
	createRoute,
	Outlet,
	useLocation,
	useMatch,
} from '@tanstack/react-router'
import { UserMenu } from '../modules/identity/components/user-menu'
import { sessionRoute } from './session.route'

const RELEASE_NOTES_URL = new URL('/changelog', import.meta.env.APP_URL).href

/** The sidebar and the views inside it, around every signed-in view but Quick Add. */
export const shellRoute = createRoute({
	getParentRoute: () => sessionRoute,
	id: 'shell',
	loader: () => ({
		sidebarPreference: readSidebarPreference(document.cookie),
		isNoDateSectionOpen: readNoDateSectionOpen(document.cookie),
	}),
	component: ShellLayout,
})

function ShellLayout() {
	const { user } = shellRoute.useRouteContext()
	const { sidebarPreference, isNoDateSectionOpen } = shellRoute.useLoaderData()
	const activePath = useLocation({ select: location => location.pathname })
	const labelMatch = useMatch({
		from: '/supported/session/shell/app/labels/$name',
		shouldThrow: false,
	})
	const projectMatch = useMatch({
		from: '/supported/session/shell/app/projects/$name',
		shouldThrow: false,
	})

	return (
		<HostAppContext
			value={{
				renderUserMenu: onShowShortcuts => (
					<UserMenu onShowShortcuts={onShowShortcuts} user={user} />
				),
				homePath: APP_PATHS.upcoming,
				appVersion: import.meta.env.APP_VERSION,
				appCommit: import.meta.env.APP_COMMIT,
				releaseNotesUrl: RELEASE_NOTES_URL,
			}}
		>
			<Shell
				activeLabelName={labelMatch?.params.name}
				activePath={activePath}
				activeProjectName={projectMatch?.params.name}
				initialIsNoDateSectionOpen={isNoDateSectionOpen}
				initialSidebarPreference={sidebarPreference}
				user={user}
			>
				<Outlet />
			</Shell>
		</HostAppContext>
	)
}
