import { z } from 'zod'

export const userIdSchema = z.uuid().brand<'UserId'>()
export type UserId = z.infer<typeof userIdSchema>
