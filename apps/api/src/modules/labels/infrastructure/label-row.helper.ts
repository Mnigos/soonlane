import type { Label } from '@soonlane/contracts'
import { label, type LabelRow } from '@soonlane/db'
import { asc, sql } from 'drizzle-orm'

export const labelOrder = [asc(sql`lower(${label.name})`), asc(label.createdAt)]

export function toLabel(row: LabelRow): Label {
	return { id: row.id, name: row.name, color: row.color ?? undefined }
}
