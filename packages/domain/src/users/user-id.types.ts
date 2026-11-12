import type { $brand } from 'zod'

export type UserId = string & $brand<'UserId'>
