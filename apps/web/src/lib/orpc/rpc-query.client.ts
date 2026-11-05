import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { rpc } from './rpc.client'

export const orpcQuery = createTanstackQueryUtils(rpc)
