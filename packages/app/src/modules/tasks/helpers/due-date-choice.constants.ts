import type { DatePickerChoice } from '@soonlane/analytics'
import type { DueDateShortcutId } from '@soonlane/domain'

export const DUE_DATE_SHORTCUT_CHOICES = {
	today: 'quick_today',
	tomorrow: 'quick_tomorrow',
	'this-weekend': 'quick_this_weekend',
	'next-week': 'quick_next_week',
	'next-weekend': 'quick_next_weekend',
} as const satisfies Record<DueDateShortcutId, DatePickerChoice>
