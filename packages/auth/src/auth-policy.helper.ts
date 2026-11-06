import type { UserId } from '@soonlane/domain'

const MIN_SECRET_LENGTH = 32

export interface AuthUser {
	id: UserId
	email: string
	name: string
	emailVerified: boolean
	image?: string
}

export interface AuthSettings {
	secret: string
	googleClientId: string
	googleClientSecret: string
}

export function canValidateSessions({
	secret,
}: Pick<AuthSettings, 'secret'>): boolean {
	return secret.length >= MIN_SECRET_LENGTH
}

export function isAuthConfigured(settings: AuthSettings): boolean {
	return (
		canValidateSessions(settings) &&
		Boolean(settings.googleClientId && settings.googleClientSecret)
	)
}

function normalizeEmail(email: string) {
	return email.trim().toLowerCase()
}

/** A comma-separated `ALLOWED_EMAILS`; empty means anyone can sign up. */
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
