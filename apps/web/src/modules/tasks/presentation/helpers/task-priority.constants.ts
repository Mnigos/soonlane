import type { TaskPriority } from '@soonlist/domain'

export const PRIORITY_CIRCLE_CLASSES = {
	1: 'border-priority-1 bg-priority-1/15 text-priority-1',
	2: 'border-priority-2 bg-priority-2/15 text-priority-2',
	3: 'border-priority-3 bg-priority-3/15 text-priority-3',
	4: 'border-priority-4 text-priority-4',
} as const satisfies Record<TaskPriority, string>

export const PRIORITY_FLAG_CLASSES = {
	1: 'text-priority-1',
	2: 'text-priority-2',
	3: 'text-priority-3',
	4: 'text-priority-4',
} as const satisfies Record<TaskPriority, string>
