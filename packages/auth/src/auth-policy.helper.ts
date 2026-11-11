import type { UserId } from '@soonlane/domain'

/** Better Auth signs sessions with `AUTH_SECRET`; shorter secrets are refused at startup. */
export const MIN_SECRET_LENGTH = 32

export interface AuthUser {
	id: UserId
	email: string
	name: string
	emailVerified: boolean
	image?: string
}

function normalizeEmail(email: string) {
	return email.trim().toLowerCase()
}

/** A comma-separated `ALLOWED_EMAILS`; an empty list means anyone can sign up. */
export function parseAllowedEmails(value: string): string[] {
	return value.split(',').map(normalizeEmail).filter(Boolean)
}

export function canSignUp(
	candidate: Pick<AuthUser, 'email' | 'emailVerified'>,
	allowedEmails: readonly string[]
): boolean {
	return (
		candidate.emailVerified &&
		(allowedEmails.length === 0 ||
			allowedEmails.includes(normalizeEmail(candidate.email)))
	)
}
