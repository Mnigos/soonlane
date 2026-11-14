import {
	CODE_CHALLENGE_PARAM,
	FRESH_SIGN_IN_PARAM,
	LOOPBACK_PORT_PARAM,
} from '@soonlane/auth'
import type { SessionUser } from '@soonlane/contracts'
import {
	HAND_OFF_COPY,
	HAND_OFF_SIGN_IN_PATHS,
	type HandOff,
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
	/** The desktop app's loopback port, which it needs; Android's page takes none. */
	port?: number
}

/** The hand-off the page was opened for: the desktop app needs its port, and Android's port, if any, is ignored. */
function toHandOff(
	app: HandOffApp,
	challenge?: string,
	port?: number
): HandOff | undefined {
	if (!challenge) return undefined
	if (app === 'android') return { app, challenge }

	return port ? { app, challenge, port } : undefined
}

function toReturnUrl(handOff: HandOff) {
	return `${HAND_OFF_SIGN_IN_PATHS[handOff.app]}?${new URLSearchParams({
		[CODE_CHALLENGE_PARAM]: handOff.challenge,
		...(handOff.app === 'desktop' && {
			[LOOPBACK_PORT_PARAM]: String(handOff.port),
		}),
	})}`
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
	const handOff = toHandOff(app, challenge, port)

	if (!handOff)
		return (
			<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-1 px-6 py-16 text-sm">
				<h1 className="font-semibold">{HAND_OFF_COPY[app].startHeading}</h1>

				<p className="text-muted-foreground">{HAND_OFF_COPY[app].startText}</p>
			</main>
		)

	const returnUrl = toReturnUrl(handOff)
	const freshUrl = `${returnUrl}&${FRESH_SIGN_IN_PARAM}=true`

	if (user && !fresh)
		return (
			<HandOffScreen
				anotherAccountUrl={freshUrl}
				handOff={handOff}
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
