import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { SignInScreen } from '../components/sign-in-screen'

const loginSearchSchema = z.object({
	error: z.string().optional().catch(undefined),
	deleted: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_session/login')({
	validateSearch: loginSearchSchema,
	beforeLoad: ({ context }) => {
		if (context.me.user) throw redirect({ to: '/app' })
	},
	head: () => ({ meta: [{ title: 'Log in · Soonlane' }] }),
	component: LoginRoute,
})

function LoginRoute() {
	const { me } = Route.useRouteContext()
	const { error, deleted } = Route.useSearch()

	return (
		<SignInScreen
			configured={me.configured}
			isAccountDeleted={deleted}
			oauthError={error}
		/>
	)
}
