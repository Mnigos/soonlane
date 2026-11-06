import { DESKTOP_SIGN_IN_PATH } from '@soonlane/auth'
import {
	type GoogleSignInRedirects,
	signInWithGoogle as startGoogleSignIn,
} from '@soonlane/auth/client'
import { cn } from '@soonlane/ui/cn'
import { Button, buttonVariants } from '@soonlane/ui/components/button'
import { mutationOptions, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { GoogleIcon } from './google-icon'

export const SIGN_IN_FAILED = 'Sign-in failed. Try again.'

async function signInWithGoogle(redirects: GoogleSignInRedirects) {
	const { error } = await startGoogleSignIn(redirects)

	if (error) throw new Error(SIGN_IN_FAILED)
}

interface ContinueWithGoogleProps {
	redirects: GoogleSignInRedirects
}

export function ContinueWithGoogle({
	redirects,
}: Readonly<ContinueWithGoogleProps>) {
	const { mutate, isPending, isSuccess, isError } = useMutation(
		mutationOptions({ mutationFn: signInWithGoogle })
	)
	const [hasOpenedBrowser, setHasOpenedBrowser] = useState(false)
	const isRedirecting = isPending || isSuccess

	return (
		<div className="flex flex-col gap-3">
			<Button
				className="desktop:hidden"
				disabled={isRedirecting}
				onClick={() => mutate(redirects)}
				size="lg"
				variant="outline"
			>
				<GoogleIcon />
				{isRedirecting ? 'Redirecting…' : 'Continue with Google'}
			</Button>

			{/* Google refuses embedded webviews: the desktop app stops this navigation and opens the sign-in in the system browser. */}
			<a
				className={cn(
					buttonVariants({ variant: 'outline', size: 'lg' }),
					'hidden desktop:inline-flex'
				)}
				href={DESKTOP_SIGN_IN_PATH}
				onClick={() => setHasOpenedBrowser(true)}
			>
				<GoogleIcon />
				Continue with Google
			</a>

			{hasOpenedBrowser && (
				<output className="text-sm text-muted-foreground">
					Finish signing in in your browser. Soonlane opens here when you are
					done.
				</output>
			)}

			{isError && (
				<p className="text-sm font-medium text-danger" role="alert">
					{SIGN_IN_FAILED}
				</p>
			)}
		</div>
	)
}
