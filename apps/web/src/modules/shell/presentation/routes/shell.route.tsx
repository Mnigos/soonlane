import { HostAppContext } from '@soonlane/app/host-app'
import { Shell } from '@soonlane/app/shell/components/shell'
import { readNoDateSectionOpen } from '@soonlane/app/shell/helpers/no-date-section-preference.helper'
import { readSidebarPreference } from '@soonlane/app/shell/helpers/sidebar-preference.helper'
import {
	createFileRoute,
	Outlet,
	redirect,
	useLocation,
	useMatch,
} from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { LayoutError } from '@/components/route-error'
import { UserMenu } from '@/modules/identity/presentation/components/user-menu'
import {
	APP_COMMIT,
	APP_VERSION,
	RELEASE_NOTES_URL,
} from '../build-info.constants'

const getCookieHeader = createIsomorphicFn()
	.server(() => getRequestHeader('cookie') ?? '')
	.client(() => document.cookie)

const shellSearchSchema = z.object({
	deleteAccount: z.boolean().optional().catch(undefined),
	error: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/_session/app')({
	validateSearch: shellSearchSchema,
	beforeLoad: ({ context }) => {
		if (!context.me.user) throw redirect({ to: '/login' })

		return { user: context.me.user }
	},
	loader: () => {
		const cookieHeader = getCookieHeader()

		return {
			sidebarPreference: readSidebarPreference(cookieHeader),
			isNoDateSectionOpen: readNoDateSectionOpen(cookieHeader),
		}
	},
	component: ShellRoute,
	errorComponent: LayoutError,
})

function ShellRoute() {
	const { user } = Route.useRouteContext()
	const { sidebarPreference, isNoDateSectionOpen } = Route.useLoaderData()
	const { deleteAccount, error } = Route.useSearch()
	const activePath = useLocation({ select: location => location.pathname })
	const labelMatch = useMatch({
		from: '/_session/app/labels/$name',
		shouldThrow: false,
	})

	return (
		<HostAppContext
			value={{
				renderUserMenu: onShowShortcuts => (
					<UserMenu
						isDeletingAccount={deleteAccount === true}
						onShowShortcuts={onShowShortcuts}
						reauthError={error}
						user={user}
					/>
				),
				homePath: '/',
				appVersion: APP_VERSION,
				appCommit: APP_COMMIT,
				releaseNotesUrl: RELEASE_NOTES_URL,
			}}
		>
			<Shell
				activeLabelName={labelMatch?.params.name}
				activePath={activePath}
				initialIsNoDateSectionOpen={isNoDateSectionOpen}
				initialSidebarPreference={sidebarPreference}
				user={user}
			>
				<Outlet />
			</Shell>
		</HostAppContext>
	)
}
