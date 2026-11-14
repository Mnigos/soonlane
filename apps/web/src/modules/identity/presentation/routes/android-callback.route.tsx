import { ANDROID_CALLBACK_PATH, SIGN_IN_CODE_PATTERN } from '@soonlane/auth'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { AndroidCallbackScreen } from '../components/android-callback-screen'
import { HAND_OFF_PAGE_HEADERS } from '../hand-off.constants'

const androidCallbackSearchSchema = z.object({
	code: z.string().regex(SIGN_IN_CODE_PATTERN).optional().catch(undefined),
})

/** Outside the session layout: the page reads no session and calls no API. */
export const Route = createFileRoute('/android/callback')({
	ssr: false,
	validateSearch: androidCallbackSearchSchema,
	beforeLoad: () => {
		// Through the History API, not the router: the router would load the page again without the code it shows.
		window.history.replaceState(window.history.state, '', ANDROID_CALLBACK_PATH)
	},
	headers: () => HAND_OFF_PAGE_HEADERS,
	head: () => ({
		meta: [
			{ title: 'Finish signing in · Soonlane' },
			{ name: 'robots', content: 'noindex, nofollow' },
		],
	}),
	component: AndroidCallbackRoute,
})

function AndroidCallbackRoute() {
	const { code } = Route.useSearch()

	return <AndroidCallbackScreen code={code} />
}
