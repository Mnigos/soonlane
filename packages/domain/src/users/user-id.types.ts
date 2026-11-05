import type { Brand } from '../shared/brand.types'

export type UserId = Brand<string, 'user_id'>

export function toUserId(value: string): UserId {
	return value as UserId
}
