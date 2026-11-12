import { z } from 'zod'

export const taskIdSchema = z.uuid().brand<'TaskId'>()
export type TaskId = z.infer<typeof taskIdSchema>
