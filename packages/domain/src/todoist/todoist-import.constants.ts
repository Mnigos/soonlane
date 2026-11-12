/**
 * What an import from Todoist changes or leaves out, each counted in the
 * preview. When Soonlane gains a feature (Todoist's repeat rules), dropping its
 * entry here makes the compiler point at the mapping and the preview line that
 * go with it.
 */
export const TODOIST_IMPORT_CHANGES = [
	'repeating',
	'alreadyImported',
	'subtasks',
	'sections',
	'deadlines',
	'durations',
	'longTitles',
	'longDescriptions',
	'longLabelNames',
	'nestedProjects',
	'longProjectNames',
] as const

export type TodoistImportChange = (typeof TODOIST_IMPORT_CHANGES)[number]
