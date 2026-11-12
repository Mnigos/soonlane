import { describeFailure } from '@soonlane/app/shell/helpers/maintenance.helper'
import {
	DESKTOP_SIGN_IN_LINK_HOST,
	DESKTOP_URL_SCHEME,
	SIGN_IN_CODE_PARAM,
} from '@soonlane/auth'
import { createDesktopSignInCode } from '@soonlane/auth/client'
import type { SessionUser } from '@soonlane/contracts'
import { Button } from '@soonlane/ui/components/button'
import { useMutation } from '@tanstack/react-query'

const HAND_OFF_FAILED = 'Could not start the desktop sign-in. Try again.'

async function openDesktopApp(challenge: string) {
	const { data, error } = await createDesktopSignInCode(challenge)

	if (error) throw new Error(HAND_OFF_FAILED, { cause: error })

	const link = new URL(`${DESKTOP_URL_SCHEME}://${DESKTOP_SIGN_IN_LINK_HOST}`)

	link.searchParams.set(SIGN_IN_CODE_PARAM, data.code)
	window.location.assign(link)

	return link.href
}

interface DesktopHandOffScreenProps {
	challenge: string
	user: SessionUser
}

/** The browser half of the desktop sign-in: an explicit click sends a one-time code to the app that asked for it. */
export function DesktopHandOffScreen({
	challenge,
	user,
}: Readonly<DesktopHandOffScreenProps>) {
	const {
		mutate,
		data: link,
		isPending,
		error,
	} = useMutation({ mutationFn: openDesktopApp })

	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-16">
			<div className="flex flex-col gap-1.5">
				<h1 className="text-2xl font-bold tracking-tight">
					Sign in to the desktop app
				</h1>

				<p className="text-sm text-muted-foreground">
					You are signed in as <span className="ph-mask">{user.email}</span>.
				</p>
			</div>

			<Button disabled={isPending} onClick={() => mutate(challenge)} size="lg">
				{isPending ? 'Opening…' : 'Open the desktop app'}
			</Button>

			{link && (
				// The link carries a one-time code: session replay records a placeholder.
				<output className="ph-no-capture flex flex-col gap-1 text-sm">
					<p className="font-semibold">You can close this tab</p>

					<p className="text-muted-foreground">
						The desktop app finishes signing in. If it did not open,{' '}
						{/* Browsers can refuse to open an app after a slow request; a click on this link always counts. */}
						<a
							className="underline underline-offset-4 hover:text-foreground"
							href={link}
						>
							open it from here
						</a>{' '}
						or check that it is in your Applications folder.
					</p>
				</output>
			)}

			{error && (
				<p className="text-sm font-medium text-danger" role="alert">
					{describeFailure(error.cause, HAND_OFF_FAILED)}
				</p>
			)}
		</main>
	)
}
