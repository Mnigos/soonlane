import { CODE_VERIFIER_PARAM, SIGN_IN_CODE_PARAM } from '@soonlane/auth'
import { exchangeDesktopSignInCode } from '@soonlane/auth/client'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { DesktopCallbackScreen } from '../components/desktop-callback-screen'

export const Route = createFileRoute('/_session/desktop/callback')({
	// The desktop app puts the code and its verifier in the fragment, which only the browser can read.
	ssr: false,
	loader: async ({ context, location }) => {
		const params = new URLSearchParams(location.hash)
		const code = params.get(SIGN_IN_CODE_PARAM)
		const verifier = params.get(CODE_VERIFIER_PARAM)
		const { error } =
			code && verifier
				? await exchangeDesktopSignInCode(code, verifier).catch(() => ({
						error: true,
					}))
				: { error: true }

		// A failed attempt drops the fragment from history, so the code and verifier do not outlive it.
		if (error && location.hash)
			throw redirect({ to: '/desktop/callback', replace: true })
		// A repeated link for a sign-in that already finished has nothing to fail.
		if (error && context.me.user) throw redirect({ to: '/app', replace: true })
		if (error) return { failed: true }

		// The cached identity still says signed out.
		context.queryClient.clear()
		throw redirect({ to: '/app', replace: true })
	},
	head: () => ({ meta: [{ title: 'Signing in · Soonlane' }] }),
	pendingMs: 0,
	pendingComponent: () => <DesktopCallbackScreen failed={false} />,
	component: DesktopCallbackRoute,
})

function DesktopCallbackRoute() {
	const { failed } = Route.useLoaderData()

	return <DesktopCallbackScreen failed={failed} />
}
