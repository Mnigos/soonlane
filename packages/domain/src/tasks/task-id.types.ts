import type { Brand } from '../shared/brand.types'

export type TaskId = Brand<string, 'task_id'>

export function toTaskId(value: string): TaskId {
	return value as TaskId
}
