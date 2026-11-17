import type { BetterAuthOptions } from 'better-auth'
import { GOOGLE_LINK_REFUSED } from './email-code.constants'

type ValidateUserInfo = NonNullable<
	NonNullable<BetterAuthOptions['user']>['validateUserInfo']
>

/** Google vouches for an address only on its own mail domains or on a Workspace domain (`hd`); any other Google account may outlive its owner's mailbox. */
const GOOGLE_MAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com'])

function isVouchedByGoogle(profile: Record<string, unknown> = {}) {
	const { email, email_verified: emailVerified, hd } = profile
	const domain =
		typeof email === 'string' ? email.split('@').at(-1)?.toLowerCase() : ''

	return (
		emailVerified === true &&
		((typeof hd === 'string' && hd !== '') ||
			GOOGLE_MAIL_DOMAINS.has(domain ?? ''))
	)
}

/**
 * Better Auth's `validateUserInfo`: a Google sign-in may link onto an account
 * it did not create, such as an email-code account with the same address,
 * only when Google vouches for that address. Every other case passes: new
 * users, returning Google users and Todoist links.
 */
export function refuseUnvouchedGoogleLink(
	offersEmailCode: boolean
): ValidateUserInfo {
	return ({ source }) => {
		if (
			source.action !== 'link-account' ||
			source.oauth?.providerId !== 'google' ||
			isVouchedByGoogle(source.oauth.profile)
		)
			return undefined

		return {
			error: GOOGLE_LINK_REFUSED,
			errorDescription: offersEmailCode
				? 'This address already has a Soonlane account. Sign in with an email code instead.'
				: 'This address already has a Soonlane account.',
		}
	}
}
