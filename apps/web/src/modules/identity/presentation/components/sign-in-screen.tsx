import type { GoogleSignInRedirects } from '@soonlane/auth/client'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { ContinueWithGoogle, SIGN_IN_FAILED } from './continue-with-google'
import { SignInLayout } from './sign-in-layout'

const LOGIN_REDIRECTS = { callbackURL: '/app', errorCallbackURL: '/login' }

interface SignInScreenProps {
	configured: boolean
	oauthError?: string
	isAccountDeleted?: boolean
	redirects?: GoogleSignInRedirects
}

export function SignInScreen({
	configured,
	oauthError,
	isAccountDeleted = false,
	redirects = LOGIN_REDIRECTS,
}: Readonly<SignInScreenProps>) {
	return (
		<SignInLayout
			description="Continue with your Google account. New to Soonlane? This creates your account."
			heading="Log in or sign up"
		>
			{isAccountDeleted && (
				<output className="text-sm font-medium">
					Your account was deleted.
				</output>
			)}

			{configured ? (
				<ContinueWithGoogle redirects={redirects} />
			) : (
				<div className="flex flex-col gap-1 text-sm" role="note">
					<p className="font-semibold">Sign-in is disabled</p>

					<p className="text-muted-foreground">
						Google is not configured on this server. Set the environment
						variables and restart the app.
					</p>
				</div>
			)}

			{oauthError && (
				<p className="text-sm font-medium text-danger" role="alert">
					{oauthError === 'SIGN_UPS_CLOSED'
						? ACCESS_ERROR_MESSAGES.SIGN_UPS_CLOSED
						: SIGN_IN_FAILED}
				</p>
			)}
		</SignInLayout>
	)
}
