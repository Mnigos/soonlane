import type { ComponentType, SVGProps } from 'react'
import type { DatePickerChoice } from '@/modules/analytics/domain/analytics-event.types'
import type { DueDateShortcutId } from '../../domain/due-date-shortcut.helper'
import {
	NextWeekIcon,
	TomorrowIcon,
	WeekendIcon,
} from '../components/composer/date-picker-icons'
import { DueCalendarIcon } from '../components/composer/due-calendar-icon'

export const DUE_DATE_SHORTCUT_ICONS = {
	today: { icon: DueCalendarIcon, className: 'text-due-today' },
	tomorrow: { icon: TomorrowIcon, className: 'text-quick-tomorrow' },
	'this-weekend': { icon: WeekendIcon, className: 'text-quick-weekend' },
	'next-week': { icon: NextWeekIcon, className: 'text-quick-week' },
	'next-weekend': { icon: WeekendIcon, className: 'text-quick-weekend' },
} as const satisfies Record<
	DueDateShortcutId,
	{ icon: ComponentType<SVGProps<SVGSVGElement>>; className: string }
>

export const DUE_DATE_SHORTCUT_CHOICES = {
	today: 'quick_today',
	tomorrow: 'quick_tomorrow',
	'this-weekend': 'quick_this_weekend',
	'next-week': 'quick_next_week',
	'next-weekend': 'quick_next_weekend',
} as const satisfies Record<DueDateShortcutId, DatePickerChoice>
