import { label } from '@soonlane/db'
import { asc, sql } from 'drizzle-orm'

export const labelOrder = [asc(sql`lower(${label.name})`), asc(label.createdAt)]
