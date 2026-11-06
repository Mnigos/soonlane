import { signInWithGoogle as startGoogleSignIn } from '@soonlane/auth/client'
import { Button } from '@soonlane/ui/components/button'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import { GoogleIcon } from './google-icon'

const SIGN_IN_FAILED = 'Sign-in failed. Try again.'

async function signInWithGoogle() {
	const { error } = await startGoogleSignIn({
		callbackURL: '/',
		errorCallbackURL: '/login',
	})

	if (error) throw new Error(SIGN_IN_FAILED)
}

interface SignInScreenProps {
	configured: boolean
	hasOAuthError: boolean
}

export function SignInScreen({
	configured,
	hasOAuthError,
}: Readonly<SignInScreenProps>) {
	const { mutate, isPending, isSuccess, isError } = useMutation(
		mutationOptions({ mutationFn: signInWithGoogle })
	)
	const isRedirecting = isPending || isSuccess

	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-16">
			<div className="flex flex-col gap-1.5">
				<h1 className="text-2xl font-bold tracking-tight">Soonlane</h1>

				<p className="text-sm text-muted-foreground">
					Your tasks, from today onwards.
				</p>
			</div>

			{configured ? (
				<Button
					className="desktop:hidden"
					disabled={isRedirecting}
					onClick={() => mutate()}
					size="lg"
					variant="outline"
				>
					<GoogleIcon />
					{isRedirecting ? 'Redirecting…' : 'Continue with Google'}
				</Button>
			) : (
				<div className="flex flex-col gap-1 text-sm" role="note">
					<p className="font-semibold">Sign-in is disabled</p>

					<p className="text-muted-foreground">
						Google is not configured on this server. Set the environment
						variables and restart the app.
					</p>
				</div>
			)}

			{/* Google refuses sign-in inside an embedded webview; the desktop app gets its own flow next. */}
			{configured && (
				<div className="hidden flex-col gap-1 text-sm desktop:flex" role="note">
					<p className="font-semibold">Desktop sign-in is coming</p>

					<p className="text-muted-foreground">
						Signing in from the desktop app arrives in the next update. Until
						then, use Soonlane in your browser.
					</p>
				</div>
			)}

			{(isError || hasOAuthError) && (
				<p className="text-sm font-medium text-danger" role="alert">
					{isError
						? SIGN_IN_FAILED
						: 'Sign-in failed. Soonlane is only available to its owner.'}
				</p>
			)}
		</main>
	)
}
