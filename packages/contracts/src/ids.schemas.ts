import { toLabelId, toTaskId, toUserId } from '@soonlane/domain'
import { z } from 'zod'

/** Ids are branded here, at the API boundary: clients send plain strings and handlers receive the domain brand. */
export const taskIdSchema = z.uuid().transform(toTaskId)
export const labelIdSchema = z.uuid().transform(toLabelId)
export const userIdSchema = z.uuid().transform(toUserId)
