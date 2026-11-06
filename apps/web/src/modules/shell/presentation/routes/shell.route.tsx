import { createFileRoute, Outlet } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { Shell } from '../components/shell'
import { readSidebarPreference } from '../helpers/sidebar-preference.helper'

// SSR reads the request's cookie header, so the first paint already has the owner's sidebar; the browser reads document.cookie.
const getSidebarPreference = createIsomorphicFn()
	.server(() => readSidebarPreference(getRequestHeader('cookie') ?? ''))
	.client(() => readSidebarPreference(document.cookie))

export const Route = createFileRoute('/_shell')({
	loader: () => ({ sidebarPreference: getSidebarPreference() }),
	component: ShellRoute,
})

function ShellRoute() {
	const { sidebarPreference } = Route.useLoaderData()

	return (
		<Shell initialSidebarPreference={sidebarPreference}>
			<Outlet />
		</Shell>
	)
}
