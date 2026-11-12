import type { Project } from '@soonlane/contracts'
import type { ProjectRow } from '@soonlane/db'

export function toProject(row: ProjectRow): Project {
	return { id: row.id, name: row.name }
}
