import type { Label } from '@soonlane/contracts'
import type { LabelRow } from '@soonlane/db'

export function toLabel(row: LabelRow): Label {
	return { id: row.id, name: row.name, color: row.color ?? undefined }
}
