import {
	CODE_CHALLENGE_PARAM,
	DESKTOP_SIGN_IN_PATH,
	FRESH_SIGN_IN_PARAM,
} from '@soonlane/auth'
import type { SessionUser } from '@soonlane/contracts'
import { DesktopHandOffScreen } from './desktop-hand-off-screen'
import { SignInScreen } from './sign-in-screen'

interface DesktopSignInScreenProps {
	challenge?: string
	user: SessionUser | null
	fresh?: boolean
	oauthError?: string
}

/**
 * The system browser's page for a sign-in the desktop app started: Google
 * first when signed out or asked for a fresh sign-in, then the hand-off. A
 * failed fresh sign-in returns here still asking for a fresh one, so it never
 * falls back to handing off the older session.
 */
export function DesktopSignInScreen({
	challenge,
	user,
	fresh = false,
	oauthError,
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

	if (user && !fresh)
		return <DesktopHandOffScreen challenge={challenge} user={user} />

	const returnUrl = `${DESKTOP_SIGN_IN_PATH}?${new URLSearchParams({ [CODE_CHALLENGE_PARAM]: challenge })}`

	return (
		<SignInScreen
			fresh={fresh}
			loginHint={user?.email}
			oauthError={oauthError}
			redirects={{
				callbackURL: returnUrl,
				errorCallbackURL: fresh
					? `${returnUrl}&${FRESH_SIGN_IN_PARAM}=true`
					: returnUrl,
			}}
		/>
	)
}
