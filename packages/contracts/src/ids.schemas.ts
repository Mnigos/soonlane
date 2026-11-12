import { z } from 'zod'

/** Ids are branded here, at the API boundary: `.brand()` brands only the parsed output, so clients send plain strings and handlers receive the domain brand. */
export const taskIdSchema = z.uuid().brand<'TaskId'>()
export const labelIdSchema = z.uuid().brand<'LabelId'>()
export const userIdSchema = z.uuid().brand<'UserId'>()
