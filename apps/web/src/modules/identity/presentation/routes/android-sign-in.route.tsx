import { CODE_CHALLENGE_PATTERN } from '@soonlane/auth'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { HandOffSignInScreen } from '../components/hand-off-sign-in-screen'
import { HAND_OFF_PAGE_HEADERS } from '../hand-off.constants'

/** No port and no return address: the code always goes to `/android/callback` on this origin. */
const androidSignInSearchSchema = z.object({
	challenge: z
		.string()
		.regex(CODE_CHALLENGE_PATTERN)
		.optional()
		.catch(undefined),
	error: z.string().optional().catch(undefined),
	fresh: z.boolean().optional().catch(undefined),
})

export const Route = createFileRoute('/_session/android/sign-in')({
	validateSearch: androidSignInSearchSchema,
	headers: () => HAND_OFF_PAGE_HEADERS,
	head: () => ({ meta: [{ title: 'Sign in to the Android app · Soonlane' }] }),
	component: AndroidSignInRoute,
})

function AndroidSignInRoute() {
	const { me } = Route.useRouteContext()
	const { challenge, error, fresh } = Route.useSearch()

	return (
		<HandOffSignInScreen
			app="android"
			challenge={challenge}
			fresh={fresh}
			oauthError={error}
			user={me.user}
		/>
	)
}
