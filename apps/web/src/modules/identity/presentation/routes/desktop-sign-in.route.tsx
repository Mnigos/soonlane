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
	fresh: z.boolean().optional().catch(undefined),
	// Unprivileged ports only: a crafted link cannot aim the hand-off at a system service.
	port: z.number().int().min(1024).max(65_535).optional().catch(undefined),
})

export const Route = createFileRoute('/_session/desktop/sign-in')({
	validateSearch: desktopSignInSearchSchema,
	head: () => ({ meta: [{ title: 'Desktop sign-in · Soonlane' }] }),
	component: DesktopSignInRoute,
})

function DesktopSignInRoute() {
	const { me } = Route.useRouteContext()
	const { challenge, error, fresh, port } = Route.useSearch()

	return (
		<DesktopSignInScreen
			challenge={challenge}
			fresh={fresh}
			oauthError={error}
			port={port}
			user={me.user}
		/>
	)
}
