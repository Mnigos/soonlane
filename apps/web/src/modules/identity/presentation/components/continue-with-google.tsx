import { describeFailure } from '@soonlane/app/shell/helpers/maintenance.helper'
import { DESKTOP_SIGN_IN_PATH, FRESH_SIGN_IN_PARAM } from '@soonlane/auth'
import {
	type GoogleSignInRedirects,
	signInWithGoogle,
} from '@soonlane/auth/client'
import { cn } from '@soonlane/ui/cn'
import { Button, buttonVariants } from '@soonlane/ui/components/button'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { GoogleIcon } from './google-icon'

export const SIGN_IN_FAILED = 'Sign-in failed. Try again.'

interface ContinueWithGoogleProps {
	redirects: GoogleSignInRedirects
	loginHint?: string
	fresh?: boolean
}

export function ContinueWithGoogle({
	redirects,
	loginHint,
	fresh = false,
}: Readonly<ContinueWithGoogleProps>) {
	const { mutate, isPending, isSuccess, error } = useMutation({
		mutationFn: async () => {
			const { error: signInError } = await signInWithGoogle(redirects, {
				loginHint,
				fresh,
			})

			if (signInError) throw new Error(SIGN_IN_FAILED, { cause: signInError })
		},
	})
	const [hasOpenedBrowser, setHasOpenedBrowser] = useState(false)
	const isRedirecting = isPending || isSuccess

	return (
		<div className="flex flex-col gap-3">
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

			{/* Google refuses embedded webviews, so the desktop app opens this link in the system browser. */}
			<a
				className={cn(
					buttonVariants({ variant: 'outline', size: 'lg' }),
					'hidden desktop:inline-flex'
				)}
				href={
					fresh
						? `${DESKTOP_SIGN_IN_PATH}?${FRESH_SIGN_IN_PARAM}=true`
						: DESKTOP_SIGN_IN_PATH
				}
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

			{error && (
				<p className="text-sm font-medium text-danger" role="alert">
					{describeFailure(error.cause, SIGN_IN_FAILED)}
				</p>
			)}
		</div>
	)
}
