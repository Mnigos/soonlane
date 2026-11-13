import { Button } from '@soonlane/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import { desktopHost } from '../../../platform/rpc/desktop-host.client'
import { SIGN_IN_COPY } from '../helpers/sign-in-copy.constants'
import { useSignInStatus } from '../hooks/use-sign-in-status'

/** The window while signed out: signing in happens in the system browser, which Google requires. */
export function SignInScreen() {
	const signInStatus = useSignInStatus()
	const { mutate: signIn, isPending } = useMutation({
		mutationFn: desktopHost.signIn,
	})

	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-16">
			{/* The window has no title bar; this strip under the traffic lights moves it. */}
			<div aria-hidden className="fixed inset-x-0 top-0 h-8 app-drag" />

			<div className="flex flex-col gap-1.5">
				<h1 className="text-2xl font-bold tracking-tight">
					{SIGN_IN_COPY.heading}
				</h1>

				<p className="text-sm text-muted-foreground">
					{SIGN_IN_COPY.description}
				</p>
			</div>

			<Button disabled={isPending} onClick={() => signIn()} size="lg">
				{SIGN_IN_COPY.continue}
			</Button>

			{signInStatus === 'waiting' && (
				<output className="text-sm text-muted-foreground">
					{SIGN_IN_COPY.waiting}
				</output>
			)}

			{signInStatus === 'failed' && (
				<p className="text-sm font-medium text-danger" role="alert">
					{SIGN_IN_COPY.failed}
				</p>
			)}
		</main>
	)
}
