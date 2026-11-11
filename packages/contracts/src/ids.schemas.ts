import type { LabelId, TaskId, UserId } from '@soonlane/domain'
import { z } from 'zod'

/** Ids are branded here, at the API boundary: clients send plain strings and handlers receive the domain brand. */
export const taskIdSchema = z.uuid().transform(id => id as TaskId)
export const labelIdSchema = z.uuid().transform(id => id as LabelId)
export const userIdSchema = z.uuid().transform(id => id as UserId)
