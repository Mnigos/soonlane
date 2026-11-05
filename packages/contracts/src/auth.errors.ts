import type { ErrorMap } from '@orpc/contract'
import { ACCESS_ERROR_MESSAGES } from '@soonlist/domain'

export const authErrors = {
	UNAUTHORIZED: { message: ACCESS_ERROR_MESSAGES.UNAUTHORIZED },
	FORBIDDEN: { message: ACCESS_ERROR_MESSAGES.FORBIDDEN },
} as const satisfies ErrorMap
