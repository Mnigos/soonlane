import { TOO_MANY_CODES } from '@soonlane/auth'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'
import { sendEmailCode, signInWithEmailCode } from '@/platform/auth/auth.client'
import { EMAIL_CODE_COPY } from '../email-code-copy.constants'

const SIGN_IN_FAILED = 'Sign-in failed. Try again.'

/** What Better Auth's `$fetch` reports for a refused request. */
interface AuthFetchError {
	status: number
	code?: string
}

function toSendError({ status, code }: AuthFetchError) {
	if (code === TOO_MANY_CODES) return EMAIL_CODE_COPY.tooManyCodes

	return status === 429
		? EMAIL_CODE_COPY.tooManyAttempts
		: EMAIL_CODE_COPY.sendFailed
}

function toSignInError({ status, code }: AuthFetchError) {
	if (code === 'INVALID_OTP') return EMAIL_CODE_COPY.invalidCode
	if (code === 'SIGN_UPS_CLOSED') return ACCESS_ERROR_MESSAGES.SIGN_UPS_CLOSED

	return status === 429 ? EMAIL_CODE_COPY.tooManyAttempts : SIGN_IN_FAILED
}

/** A refusal becomes its message; a request that never got an answer becomes the plain fallback. */
export async function sendCodeTo(email: string) {
	try {
		const { error } = await sendEmailCode(email)

		if (error) return new Error(toSendError(error))
	} catch {
		return new Error(EMAIL_CODE_COPY.sendFailed)
	}

	return email
}

export async function signInWithCode(email: string, code: string) {
	try {
		const { error } = await signInWithEmailCode(email, code)

		return error ? new Error(toSignInError(error)) : undefined
	} catch {
		return new Error(SIGN_IN_FAILED)
	}
}
