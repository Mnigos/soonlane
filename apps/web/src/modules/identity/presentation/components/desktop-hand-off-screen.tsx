import {
	LOOPBACK_CALLBACK_PATH,
	LOOPBACK_HOST,
	SIGN_IN_CODE_PARAM,
} from '@soonlane/auth'
import { createDesktopSignInCode } from '@soonlane/auth/client'
import type { SessionUser } from '@soonlane/contracts'
import { Button } from '@soonlane/ui/components/button'
import { useMutation } from '@tanstack/react-query'

const HAND_OFF_FAILED = 'Could not start the desktop sign-in. Try again.'

interface HandOff {
	challenge: string
	port: number
}

/** Leaves for the app's loopback listener (RFC 8252), which answers with its own page. */
async function openDesktopApp({ challenge, port }: HandOff) {
	const { data, error } = await createDesktopSignInCode(challenge)

	if (error) throw new Error(HAND_OFF_FAILED, { cause: error })

	const link = new URL(
		`http://${LOOPBACK_HOST}:${port}${LOOPBACK_CALLBACK_PATH}`
	)

	link.searchParams.set(SIGN_IN_CODE_PARAM, data.code)
	window.location.assign(link)
}

interface DesktopHandOffScreenProps extends HandOff {
	user: SessionUser
}

/** The browser half of the desktop sign-in: an explicit click sends a one-time code to the app that asked for it. */
export function DesktopHandOffScreen({
	challenge,
	port,
	user,
}: Readonly<DesktopHandOffScreenProps>) {
	const { mutate, isPending, error } = useMutation({
		mutationFn: openDesktopApp,
	})

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

			<Button
				disabled={isPending}
				onClick={() => mutate({ challenge, port })}
				size="lg"
			>
				{isPending ? 'Opening…' : 'Open the desktop app'}
			</Button>

			{error && (
				<p className="text-sm font-medium text-danger" role="alert">
					{HAND_OFF_FAILED}
				</p>
			)}
		</main>
	)
}
