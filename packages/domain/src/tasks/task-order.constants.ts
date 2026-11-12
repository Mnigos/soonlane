/** How open task lists sort, first key first: the API's SQL and the app's cached lists both walk it. */
export const TASK_DAY_ORDER = [
	'dueDate',
	'dueTime',
	'priority',
	'createdAt',
] as const

export type TaskDayOrderKey = (typeof TASK_DAY_ORDER)[number]

/** How Completed lists sort, first key first. */
export const TASK_COMPLETED_ORDER = ['completedAt', 'createdAt'] as const

export type TaskCompletedOrderKey = (typeof TASK_COMPLETED_ORDER)[number]
