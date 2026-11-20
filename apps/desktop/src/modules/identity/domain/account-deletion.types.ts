import type { ReauthMethod } from '@soonlane/auth'

/** The account a deletion was started for, as the page's confirmation named it; only this user is ever deleted. */
export interface DeletingAccount {
	readonly id: string
	readonly email: string
}

/**
 * How a deletion ended without failing. `signed-in-as` means nothing was
 * deleted, because the token belongs to another user. `signed-out` means the
 * server has no session for the token, so the app cannot confirm whether the
 * account is gone.
 */
export type AccountDeletion =
	| { readonly status: 'deleted' }
	| {
			readonly status: 'needs-fresh-sign-in'
			readonly reauth: readonly ReauthMethod[]
			readonly isGoogleLoginStale: boolean
	  }
	| { readonly status: 'signed-in-as'; readonly email: string }
	| { readonly status: 'signed-out' }
