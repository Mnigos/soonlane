import type { GoogleSignInRedirects } from '@soonlane/auth/client'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { SITE_ORIGIN } from '@/modules/hosting/presentation/hosting.constants'
import { ContinueWithGoogle, SIGN_IN_FAILED } from './continue-with-google'
import { SignInLayout } from './sign-in-layout'

const LOGIN_REDIRECTS = { callbackURL: '/', errorCallbackURL: '/login' }
const LEGAL_LINK_CLASS = 'text-foreground underline underline-offset-2'

interface SignInScreenProps {
	oauthError?: string
	isAccountDeleted?: boolean
	redirects?: GoogleSignInRedirects
	loginHint?: string
	fresh?: boolean
}

export function SignInScreen({
	oauthError,
	isAccountDeleted = false,
	redirects = LOGIN_REDIRECTS,
	loginHint,
	fresh = false,
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

			<div className="flex flex-col gap-3">
				<ContinueWithGoogle
					fresh={fresh}
					loginHint={loginHint}
					redirects={redirects}
				/>

				<p className="text-caption text-muted-foreground">
					By continuing you agree to the{' '}
					<a className={LEGAL_LINK_CLASS} href={`${SITE_ORIGIN}/terms`}>
						Terms
					</a>{' '}
					and the{' '}
					<a className={LEGAL_LINK_CLASS} href={`${SITE_ORIGIN}/privacy`}>
						Privacy Policy
					</a>
					.
				</p>
			</div>

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
