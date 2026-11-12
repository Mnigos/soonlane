/**
 * What an import from Todoist changes or leaves out, each counted in the
 * preview. When Soonlane gains a feature (tasks without a date,
 * Todoist's repeat rules), dropping its entry here makes the compiler point at
 * the mapping and the preview line that go with it.
 */
export const TODOIST_IMPORT_CHANGES = [
	'repeating',
	'noDate',
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
