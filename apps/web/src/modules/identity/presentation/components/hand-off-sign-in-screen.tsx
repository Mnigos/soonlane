import {
	CODE_CHALLENGE_PARAM,
	FRESH_SIGN_IN_PARAM,
	LOOPBACK_PORT_PARAM,
} from '@soonlane/auth'
import type { SessionUser, SignInMethods } from '@soonlane/contracts'
import { useSyncExternalStore } from 'react'
import {
	HAND_OFF_COPY,
	HAND_OFF_SIGN_IN_PATHS,
	type HandOff,
	type HandOffApp,
} from '../hand-off.constants'
import { isDesktopAppBrowser } from '../helpers/desktop-app-browser.helper'
import { HandOffScreen } from './hand-off-screen'
import { SignInScreen } from './sign-in-screen'

interface HandOffSignInScreenProps {
	app: HandOffApp
	challenge?: string
	user: SessionUser | null
	/** Loaded only when the page signs in: signed out, or asked for a fresh sign-in. */
	methods?: SignInMethods
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

/** The browser never changes platform while the page is open. */
const subscribeToNothing = () => () => undefined
/** The browser is unknown during SSR and hydration, so nothing actionable renders until it is. */
const getUnknownBrowser = () => undefined

interface HandOffMessageProps {
	heading: string
	text: string
}

function HandOffMessage({ heading, text }: Readonly<HandOffMessageProps>) {
	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-1 px-6 py-16 text-sm">
			<h1 className="font-semibold">{heading}</h1>

			<p className="text-muted-foreground">{text}</p>
		</main>
	)
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
 * a sign-in first (Google or an email code) when signed out or asked for a fresh one, then the
 * hand-off. A failed fresh sign-in returns here still asking for a fresh one,
 * so it never falls back to handing off the older session. The desktop hand-off
 * runs only in a browser on the desktop app's platform, so a phone app cannot
 * open this page with its own challenge and port and receive the code.
 */
export function HandOffSignInScreen({
	app,
	challenge,
	user,
	methods,
	fresh = false,
	oauthError,
	port,
}: Readonly<HandOffSignInScreenProps>) {
	const canHandOffToDesktop = useSyncExternalStore(
		subscribeToNothing,
		isDesktopAppBrowser,
		getUnknownBrowser
	)
	const handOff = toHandOff(app, challenge, port)

	if (!handOff)
		return (
			<HandOffMessage
				heading={HAND_OFF_COPY[app].startHeading}
				text={HAND_OFF_COPY[app].startText}
			/>
		)

	if (handOff.app === 'desktop' && !canHandOffToDesktop)
		return canHandOffToDesktop === undefined ? null : (
			<HandOffMessage
				heading={HAND_OFF_COPY.desktop.otherDeviceHeading}
				text={HAND_OFF_COPY.desktop.otherDeviceText}
			/>
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
	// The route loads the methods for exactly this case; without them there is nothing to offer yet.
	if (!methods) return null

	return (
		<SignInScreen
			fresh={fresh}
			methods={methods}
			loginHint={user?.email}
			oauthError={oauthError}
			redirects={{
				callbackURL: returnUrl,
				errorCallbackURL: fresh ? freshUrl : returnUrl,
			}}
		/>
	)
}
