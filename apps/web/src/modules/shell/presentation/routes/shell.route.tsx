import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { Shell } from '../components/shell'
import { readSidebarPreference } from '../helpers/sidebar-preference.helper'
import { getServerSidebarPreference } from '../helpers/sidebar-preference.helper.server'

// SSR reads the cookie from the request, so the first paint already has the owner's sidebar; the client build drops the server branch.
const getSidebarPreference = createIsomorphicFn()
	.server(getServerSidebarPreference)
	.client(() => readSidebarPreference(document.cookie))

export const Route = createFileRoute('/_shell')({
	beforeLoad: ({ context }) => {
		if (!context.me.user) throw redirect({ to: '/login' })

		return { user: context.me.user }
	},
	loader: () => ({ sidebarPreference: getSidebarPreference() }),
	component: ShellRoute,
})

function ShellRoute() {
	const { user } = Route.useRouteContext()
	const { sidebarPreference } = Route.useLoaderData()

	return (
		<Shell initialSidebarPreference={sidebarPreference} user={user}>
			<Outlet />
		</Shell>
	)
}
