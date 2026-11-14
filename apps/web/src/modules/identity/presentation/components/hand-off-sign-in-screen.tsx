import {
	CODE_CHALLENGE_PARAM,
	FRESH_SIGN_IN_PARAM,
	LOOPBACK_PORT_PARAM,
} from '@soonlane/auth'
import type { SessionUser } from '@soonlane/contracts'
import {
	HAND_OFF_COPY,
	HAND_OFF_SIGN_IN_PATHS,
	type HandOffApp,
} from '../hand-off.constants'
import { HandOffScreen } from './hand-off-screen'
import { SignInScreen } from './sign-in-screen'

interface HandOffSignInScreenProps {
	app: HandOffApp
	challenge?: string
	user: SessionUser | null
	fresh?: boolean
	oauthError?: string
	/** The desktop app's loopback port; unset, the code goes back through the app's own link. */
	port?: number
}

/**
 * The system browser's page for a sign-in the desktop or Android app started:
 * Google first when signed out or asked for a fresh sign-in, then the
 * hand-off. A failed fresh sign-in returns here still asking for a fresh one,
 * so it never falls back to handing off the older session.
 */
export function HandOffSignInScreen({
	app,
	challenge,
	user,
	fresh = false,
	oauthError,
	port,
}: Readonly<HandOffSignInScreenProps>) {
	if (!challenge)
		return (
			<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-1 px-6 py-16 text-sm">
				<h1 className="font-semibold">{HAND_OFF_COPY[app].startHeading}</h1>

				<p className="text-muted-foreground">{HAND_OFF_COPY[app].startText}</p>
			</main>
		)

	const returnUrl = `${HAND_OFF_SIGN_IN_PATHS[app]}?${new URLSearchParams({
		[CODE_CHALLENGE_PARAM]: challenge,
		...(port && { [LOOPBACK_PORT_PARAM]: String(port) }),
	})}`
	const freshUrl = `${returnUrl}&${FRESH_SIGN_IN_PARAM}=true`

	if (user && !fresh)
		return (
			<HandOffScreen
				anotherAccountUrl={freshUrl}
				app={app}
				challenge={challenge}
				port={port}
				user={user}
			/>
		)

	return (
		<SignInScreen
			fresh={fresh}
			loginHint={user?.email}
			oauthError={oauthError}
			redirects={{
				callbackURL: returnUrl,
				errorCallbackURL: fresh ? freshUrl : returnUrl,
			}}
		/>
	)
}
