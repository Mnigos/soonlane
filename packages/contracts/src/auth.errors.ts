import type { ErrorMap } from '@orpc/contract'
import { ACCESS_ERROR_MESSAGES } from '@soonlane/domain'

export const authErrors = {
	UNAUTHORIZED: { message: ACCESS_ERROR_MESSAGES.UNAUTHORIZED },
} as const satisfies ErrorMap
