import type { $brand } from 'zod'

export type TaskId = string & $brand<'TaskId'>
