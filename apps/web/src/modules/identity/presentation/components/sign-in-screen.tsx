import { GOOGLE_LINK_REFUSED } from '@soonlane/auth'
import type { GoogleSignInRedirects } from '@soonlane/auth/client'
import type { SignInMethods } from '@soonlane/contracts'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { useState } from 'react'
import { LANDING_ORIGIN } from '@/modules/hosting/presentation/hosting.constants'
import { EMAIL_CODE_COPY } from '../email-code-copy.constants'
import { ContinueWithGoogle, SIGN_IN_FAILED } from './continue-with-google'
import { EmailCodeSignIn } from './email-code-sign-in'
import { SignInLayout } from './sign-in-layout'

const LOGIN_REDIRECTS = { callbackURL: '/', errorCallbackURL: '/login' }
const BROKEN_MCP_LINK =
	"This link isn't working. Go back to your app and try again."
const PLAIN_LOGIN_LINK = 'Log in to Soonlane'
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

/**
 * An agent's authorization sent the browser here with its signed request: after the sign-in, Better Auth's client follows the provider's answer,
 * not `redirects`. `isExpired` is decided on the server with its clock at the first load; afterwards only the provider's refusal expires the page,
 * so a fast device clock cannot. `picksAccount` is the agent's Switch account, which shows Google's account chooser.
 */
export interface McpSignIn {
	isExpired: boolean
	picksAccount: boolean
}

interface SignInScreenProps {
	methods: SignInMethods
	oauthError?: string
	isAccountDeleted?: boolean
	mcpSignIn?: McpSignIn
	redirects?: GoogleSignInRedirects
	loginHint?: string
	fresh?: boolean
}

export function SignInScreen({
	methods,
	oauthError,
	isAccountDeleted = false,
	mcpSignIn,
	redirects = LOGIN_REDIRECTS,
	loginHint,
	fresh = false,
}: Readonly<SignInScreenProps>) {
	const [hasExpired, setHasExpired] = useState(mcpSignIn?.isExpired ?? false)
	const expire = mcpSignIn && (() => setHasExpired(true))

	if (hasExpired)
		return (
			<SignInLayout heading="Log in or sign up">
				<p className="text-sm font-medium text-danger" role="alert">
					{BROKEN_MCP_LINK}
				</p>

				<a
					className="self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
					href="/login"
				>
					{PLAIN_LOGIN_LINK}
				</a>
			</SignInLayout>
		)

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
						onMcpClientRequestRefused={expire}
						redirects={redirects}
						selectAccount={mcpSignIn?.picksAccount}
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
						onMcpClientRequestRefused={expire}
						onSignedIn={() => {
							if (!mcpSignIn)
								window.location.assign(
									new URL(redirects.callbackURL, window.location.origin)
								)
						}}
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
