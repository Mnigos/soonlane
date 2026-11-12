import { z } from 'zod'

export const labelIdSchema = z.uuid().brand<'LabelId'>()
export type LabelId = z.infer<typeof labelIdSchema>
