/** P1 is the most urgent, P4 the default; the UI colors them red, orange, blue and grey. */
export const TASK_PRIORITIES = [1, 2, 3, 4] as const

export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const DEFAULT_TASK_PRIORITY = 4 satisfies TaskPriority
export const TASK_TITLE_MAX_LENGTH = 500
export const TASK_DESCRIPTION_MAX_LENGTH = 4000
