import {
	ANDROID_CALLBACK_PATH,
	LOOPBACK_CALLBACK_PATH,
	LOOPBACK_HOST,
	SIGN_IN_CODE_PARAM,
} from '@soonlane/auth'
import { createDesktopSignInCode } from '@soonlane/auth/client'
import type { SessionUser } from '@soonlane/contracts'
import { Button } from '@soonlane/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import { HAND_OFF_COPY, type HandOff } from '../hand-off.constants'
import { isDesktopAppBrowser } from '../helpers/desktop-app-browser.helper'

/** Android's App Link on this origin or the desktop app's loopback listener (RFC 8252); never an address the opener chose. */
function toAppLink(handOff: HandOff) {
	if (handOff.app === 'android')
		return new URL(ANDROID_CALLBACK_PATH, window.location.origin)

	return new URL(
		`http://${LOOPBACK_HOST}:${handOff.port}${LOOPBACK_CALLBACK_PATH}`
	)
}

async function openApp(handOff: HandOff) {
	if (handOff.app === 'desktop' && !isDesktopAppBrowser())
		throw new Error(HAND_OFF_COPY.desktop.error)

	const { data, error } = await createDesktopSignInCode(handOff.challenge)

	if (error) throw new Error(HAND_OFF_COPY[handOff.app].error, { cause: error })

	const link = toAppLink(handOff)

	link.searchParams.set(SIGN_IN_CODE_PARAM, data.code)
	window.location.assign(link)

	return link.href
}

interface HandOffScreenProps {
	handOff: HandOff
	user: SessionUser
	/** This page asking for a fresh sign-in, where another account can be picked. */
	anotherAccountUrl: string
}

/** The browser half of an app's sign-in: an explicit click sends a one-time code to the app that asked for it. */
export function HandOffScreen({
	handOff,
	user,
	anotherAccountUrl,
}: Readonly<HandOffScreenProps>) {
	const copy = HAND_OFF_COPY[handOff.app]
	const {
		mutate,
		data: link,
		isPending,
		error,
	} = useMutation({ mutationFn: openApp })

	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-16">
			<div className="flex flex-col gap-1.5">
				<h1 className="text-2xl font-bold tracking-tight">{copy.heading}</h1>

				<p className="text-sm text-muted-foreground">
					You are signed in as <span className="ph-mask">{user.email}</span>.
				</p>
			</div>

			<div className="flex flex-col gap-3">
				<Button disabled={isPending} onClick={() => mutate(handOff)} size="lg">
					{isPending ? 'Opening…' : copy.button}
				</Button>

				<a
					className="self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
					href={anotherAccountUrl}
				>
					Use a different account
				</a>
			</div>

			{/* The desktop app's loopback page replaces this one; Android's App Link may leave the tab here. */}
			{link && handOff.app === 'android' && (
				// The link carries a one-time code: session replay records a placeholder.
				<output className="ph-no-capture flex flex-col gap-1 text-sm">
					<p className="font-semibold">You can close this tab</p>

					<p className="text-muted-foreground">
						{HAND_OFF_COPY.android.openedBeforeLink}
						{/* Browsers can refuse to open an app after a slow request; a click on this link always counts. */}
						<a
							className="underline underline-offset-4 hover:text-foreground"
							href={link}
						>
							open it from here
						</a>
						{HAND_OFF_COPY.android.openedAfterLink}
					</p>
				</output>
			)}

			{error && (
				<p className="text-sm font-medium text-danger" role="alert">
					{copy.error}
				</p>
			)}
		</main>
	)
}
