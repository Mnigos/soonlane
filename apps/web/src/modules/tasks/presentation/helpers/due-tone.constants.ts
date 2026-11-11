import type { DueTone } from '@soonlane/domain'

export const DUE_TONE_CLASSES = {
	overdue: 'text-danger',
	today: 'text-due-today',
	tomorrow: 'text-due-tomorrow',
	week: 'text-due-week',
	later: 'text-muted-foreground',
} as const satisfies Record<DueTone, string>
