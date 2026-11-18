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
		if (context.me.user) throw redirect({ to: '/' })
	},
	// A failure falls to the session layout's error screen, which offers a retry; never a screen without a way in.
	loader: async ({ context }) =>
		await context.queryClient.query(
			context.orpc.identity.signInMethods.queryOptions()
		),
	head: () => ({ meta: [{ title: 'Log in · Soonlane' }] }),
	component: LoginRoute,
})

function LoginRoute() {
	const { error, deleted } = Route.useSearch()
	const methods = Route.useLoaderData()

	return (
		<SignInScreen
			isAccountDeleted={deleted}
			methods={methods}
			oauthError={error}
		/>
	)
}
