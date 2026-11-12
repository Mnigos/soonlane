import { z } from 'zod'

export const projectIdSchema = z.uuid().brand<'ProjectId'>()
export type ProjectId = z.infer<typeof projectIdSchema>
