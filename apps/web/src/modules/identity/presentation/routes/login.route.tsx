import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { hasExpiredOnServer } from '@/modules/mcp/presentation/helpers/mcp-client-request.helper'
import { SignInScreen } from '../components/sign-in-screen'

/**
 * Loose, and blind to an agent's signed request: its params pass through untouched, so the validated search equals the parsed one, the router
 * never rewrites the URL, and the browser client reads the request from the URL as the provider signed it on every sign-in.
 */
const loginSearchSchema = z.looseObject({
	error: z.string().optional().catch(undefined),
	deleted: z.boolean().optional().catch(undefined),
})
const MS_PER_SECOND = 1000

export const Route = createFileRoute('/_session/login')({
	validateSearch: loginSearchSchema,
	beforeLoad: ({ context, search }) => {
		const isMcpSignIn = search.sig !== undefined

		// An agent may ask a signed-in user to sign in again (`prompt=login`).
		if (context.me.user && !isMcpSignIn) throw redirect({ to: '/' })

		return {
			mcpSignIn: isMcpSignIn
				? {
						isExpired: hasExpiredOnServer(
							typeof search.exp === 'number' ? search.exp * MS_PER_SECOND : 0
						),
						picksAccount: search.prompt === 'login',
					}
				: undefined,
		}
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
	const { mcpSignIn } = Route.useRouteContext()
	const methods = Route.useLoaderData()

	return (
		<SignInScreen
			mcpSignIn={mcpSignIn}
			isAccountDeleted={deleted}
			methods={methods}
			oauthError={error}
		/>
	)
}
