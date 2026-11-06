import { CODE_CHALLENGE_PARAM, DESKTOP_SIGN_IN_PATH } from '@soonlane/auth'
import type { SessionUser } from '@soonlane/contracts'
import { DesktopHandOffScreen } from './desktop-hand-off-screen'
import { SignInScreen } from './sign-in-screen'

interface DesktopSignInScreenProps {
	challenge?: string
	user: SessionUser | null
	configured: boolean
	hasOAuthError: boolean
}

/** The system browser's page for a sign-in the desktop app started: Google first when signed out, then the hand-off. */
export function DesktopSignInScreen({
	challenge,
	user,
	configured,
	hasOAuthError,
}: Readonly<DesktopSignInScreenProps>) {
	if (!challenge)
		return (
			<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-1 px-6 py-16 text-sm">
				<h1 className="font-semibold">Start from the desktop app</h1>

				<p className="text-muted-foreground">
					This page finishes a sign-in that the Soonlane desktop app started.
					Open the app and choose Continue with Google.
				</p>
			</main>
		)

	if (user) return <DesktopHandOffScreen challenge={challenge} user={user} />

	// Google returns to this page, challenge included, so the hand-off continues after sign-in.
	const returnUrl = `${DESKTOP_SIGN_IN_PATH}?${new URLSearchParams({ [CODE_CHALLENGE_PARAM]: challenge })}`

	return (
		<SignInScreen
			configured={configured}
			hasOAuthError={hasOAuthError}
			redirects={{ callbackURL: returnUrl, errorCallbackURL: returnUrl }}
		/>
	)
}
