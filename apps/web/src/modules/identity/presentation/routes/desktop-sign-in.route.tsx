import { CODE_CHALLENGE_PATTERN } from '@soonlane/auth'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DesktopSignInScreen } from '../components/desktop-sign-in-screen'

const desktopSignInSearchSchema = z.object({
	challenge: z
		.string()
		.regex(CODE_CHALLENGE_PATTERN)
		.optional()
		.catch(undefined),
	error: z.string().optional().catch(undefined),
})

export const Route = createFileRoute('/desktop/sign-in')({
	validateSearch: desktopSignInSearchSchema,
	head: () => ({ meta: [{ title: 'Desktop sign-in · Soonlane' }] }),
	component: DesktopSignInRoute,
})

function DesktopSignInRoute() {
	const { me } = Route.useRouteContext()
	const { challenge, error } = Route.useSearch()

	return (
		<DesktopSignInScreen
			challenge={challenge}
			configured={me.configured}
			oauthError={error}
			user={me.user}
		/>
	)
}
