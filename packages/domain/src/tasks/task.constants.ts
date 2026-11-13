/** P1 is the most urgent, P4 the default; the UI colors them red, orange, blue and grey. */
export const TASK_PRIORITIES = [1, 2, 3, 4] as const

export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const DEFAULT_TASK_PRIORITY = 4 satisfies TaskPriority
export const TASK_TITLE_MAX_LENGTH = 500
export const TASK_DESCRIPTION_MAX_LENGTH = 4000
export const GOAL_TARGET_MAX = 10_000
export const GOAL_UNIT_MAX_LENGTH = 24
export const TASK_SEARCH_QUERY_MAX_LENGTH = 100
export const DURATION_MINUTES_MIN = 5
export const DURATION_MINUTES_MAX = 1440
/** Levels of subtasks below a top-level task, which sits at depth 0. */
export const SUBTASK_DEPTH_MAX = 4
/** Direct subtasks of one task, completed ones included. */
export const SUBTASKS_PER_TASK_MAX = 50
