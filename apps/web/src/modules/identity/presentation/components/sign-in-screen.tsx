import { GOOGLE_LINK_REFUSED } from '@soonlane/auth'
import type { GoogleSignInRedirects } from '@soonlane/auth/client'
import type { SignInMethods } from '@soonlane/contracts'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { LANDING_ORIGIN } from '@/modules/hosting/presentation/hosting.constants'
import { EMAIL_CODE_COPY } from '../email-code-copy.constants'
import { ContinueWithGoogle, SIGN_IN_FAILED } from './continue-with-google'
import { EmailCodeSignIn } from './email-code-sign-in'
import { SignInLayout } from './sign-in-layout'

const LOGIN_REDIRECTS = { callbackURL: '/', errorCallbackURL: '/login' }
const LEGAL_LINK_CLASS = 'text-foreground underline underline-offset-2'

const DESCRIPTIONS = {
	both: 'Continue with Google or your email. New to Soonlane? This creates your account.',
	google:
		'Continue with your Google account. New to Soonlane? This creates your account.',
	email:
		'Continue with your email. New to Soonlane? This creates your account.',
}

function toErrorMessage(oauthError: string) {
	if (oauthError === 'SIGN_UPS_CLOSED')
		return ACCESS_ERROR_MESSAGES.SIGN_UPS_CLOSED

	return oauthError === GOOGLE_LINK_REFUSED
		? EMAIL_CODE_COPY.googleLinkRefused
		: SIGN_IN_FAILED
}

interface SignInScreenProps {
	methods: SignInMethods
	oauthError?: string
	isAccountDeleted?: boolean
	redirects?: GoogleSignInRedirects
	loginHint?: string
	fresh?: boolean
}

export function SignInScreen({
	methods,
	oauthError,
	isAccountDeleted = false,
	redirects = LOGIN_REDIRECTS,
	loginHint,
	fresh = false,
}: Readonly<SignInScreenProps>) {
	return (
		<SignInLayout
			description={
				DESCRIPTIONS[
					methods.google && methods.emailCode
						? 'both'
						: methods.google
							? 'google'
							: 'email'
				]
			}
			heading="Log in or sign up"
		>
			{isAccountDeleted && (
				<output className="text-sm font-medium">
					Your account was deleted.
				</output>
			)}

			<div className="flex flex-col gap-3">
				{methods.google && (
					<ContinueWithGoogle
						fresh={fresh}
						loginHint={loginHint}
						redirects={redirects}
					/>
				)}

				{methods.google && methods.emailCode && (
					<div
						aria-hidden
						className="flex items-center gap-3 text-caption text-faint-foreground"
					>
						<span className="h-px flex-1 bg-border" />

						{EMAIL_CODE_COPY.divider}

						<span className="h-px flex-1 bg-border" />
					</div>
				)}

				{methods.emailCode && (
					<EmailCodeSignIn
						onSignedIn={() =>
							window.location.assign(
								new URL(redirects.callbackURL, window.location.origin)
							)
						}
					/>
				)}

				<p className="text-caption text-muted-foreground">
					By continuing you agree to the{' '}
					<a className={LEGAL_LINK_CLASS} href={`${LANDING_ORIGIN}/terms`}>
						Terms
					</a>{' '}
					and the{' '}
					<a className={LEGAL_LINK_CLASS} href={`${LANDING_ORIGIN}/privacy`}>
						Privacy Policy
					</a>
					.
				</p>
			</div>

			{oauthError && (
				<p className="text-sm font-medium text-danger" role="alert">
					{toErrorMessage(oauthError)}
				</p>
			)}
		</SignInLayout>
	)
}
