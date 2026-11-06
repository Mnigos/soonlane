import type { UserId } from '@soonlane/domain'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u
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
	ownerEmail: string
	googleClientId: string
	googleClientSecret: string
}

export function canValidateSessions({
	ownerEmail,
	secret,
}: Pick<AuthSettings, 'ownerEmail' | 'secret'>): boolean {
	return secret.length >= MIN_SECRET_LENGTH && EMAIL_PATTERN.test(ownerEmail)
}

export function isAuthConfigured(settings: AuthSettings): boolean {
	return (
		canValidateSessions(settings) &&
		Boolean(settings.googleClientId && settings.googleClientSecret)
	)
}

export function isOwner(
	user: Pick<AuthUser, 'email' | 'emailVerified'>,
	ownerEmail: string
): boolean {
	const normalizedOwnerEmail = ownerEmail.trim().toLowerCase()

	return (
		Boolean(normalizedOwnerEmail) &&
		user.emailVerified &&
		user.email.trim().toLowerCase() === normalizedOwnerEmail
	)
}
