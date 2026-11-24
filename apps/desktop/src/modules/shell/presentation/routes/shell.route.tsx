import { HostAppContext } from '@soonlane/app/host-app'
import { Shell } from '@soonlane/app/shell/components/shell'
import { readNoDateSectionOpen } from '@soonlane/app/shell/helpers/no-date-section-preference.helper'
import { readSidebarPreference } from '@soonlane/app/shell/helpers/sidebar-preference.helper'
import { LINEAR_CONNECT_PATH } from '@soonlane/auth'
import {
	createRoute,
	Outlet,
	useLocation,
	useMatch,
} from '@tanstack/react-router'
import { UserMenu } from '../../../identity/presentation/components/user-menu'
import { sessionRoute } from '../../../identity/presentation/routes/session.route'

const RELEASE_NOTES_URL = new URL('/changelog', import.meta.env.LANDING_URL)
	.href
/** Linking runs in the browser, which holds the OAuth state cookie and the web session. */
const LINEAR_CONNECT_URL = new URL(LINEAR_CONNECT_PATH, import.meta.env.APP_URL)

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
		from: '/supported/session/shell/labels/$name',
		shouldThrow: false,
	})
	const projectMatch = useMatch({
		from: '/supported/session/shell/projects/$name',
		shouldThrow: false,
	})

	return (
		<HostAppContext
			value={{
				renderUserMenu: onShowShortcuts => (
					<UserMenu onShowShortcuts={onShowShortcuts} user={user} />
				),
				appVersion: import.meta.env.APP_VERSION,
				appCommit: import.meta.env.APP_COMMIT,
				releaseNotesUrl: RELEASE_NOTES_URL,
				linearConnectHref: LINEAR_CONNECT_URL.href,
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
