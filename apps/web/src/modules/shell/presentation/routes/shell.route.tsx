import {
	createFileRoute,
	Outlet,
	redirect,
	useMatch,
} from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { Shell } from '../components/shell'
import { readSidebarPreference } from '../helpers/sidebar-preference.helper'

// SSR reads the request's cookie header, so the first paint already has the owner's sidebar; the browser reads document.cookie.
const getSidebarPreference = createIsomorphicFn()
	.server(() => readSidebarPreference(getRequestHeader('cookie') ?? ''))
	.client(() => readSidebarPreference(document.cookie))

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
	loader: () => ({ sidebarPreference: getSidebarPreference() }),
	component: ShellRoute,
})

function ShellRoute() {
	const { user } = Route.useRouteContext()
	const { sidebarPreference } = Route.useLoaderData()
	const { deleteAccount, error } = Route.useSearch()
	const labelMatch = useMatch({
		from: '/_session/app/labels/$name',
		shouldThrow: false,
	})

	return (
		<Shell
			activeLabelName={labelMatch?.params.name}
			initialSidebarPreference={sidebarPreference}
			isDeletingAccount={deleteAccount === true}
			reauthError={error}
			user={user}
		>
			<Outlet />
		</Shell>
	)
}
