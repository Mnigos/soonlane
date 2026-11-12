import type { DatePickerChoice } from '@soonlane/analytics'
import type { DueDateShortcutId } from '@soonlane/domain'
import { Ban } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import {
	NextWeekIcon,
	TomorrowIcon,
	WeekendIcon,
} from '../components/composer/date-picker-icons'
import { DueCalendarIcon } from '../components/composer/due-calendar-icon'

const QUICK_ICON_STROKE = 1.1

/** Todoist's quick date icons at 22px: green calendar, orange sun, purple arrow, blue couch; the calendar is drawn at 16px, so it takes a thinner stroke. */
export const DUE_DATE_SHORTCUT_ICONS = {
	today: {
		icon: DueCalendarIcon,
		className: 'text-due-today',
		strokeWidth: 0.75,
	},
	tomorrow: {
		icon: TomorrowIcon,
		className: 'text-quick-tomorrow',
		strokeWidth: QUICK_ICON_STROKE,
	},
	'this-weekend': {
		icon: WeekendIcon,
		className: 'text-quick-weekend',
		strokeWidth: QUICK_ICON_STROKE,
	},
	'next-week': {
		icon: NextWeekIcon,
		className: 'text-quick-week',
		strokeWidth: QUICK_ICON_STROKE,
	},
	'next-weekend': {
		icon: WeekendIcon,
		className: 'text-quick-weekend',
		strokeWidth: QUICK_ICON_STROKE,
	},
} as const satisfies Record<
	DueDateShortcutId,
	{
		icon: ComponentType<SVGProps<SVGSVGElement>>
		className: string
		strokeWidth: number
	}
>

/** Todoist's grey slashed circle for removing the date, next to the quick dates. */
export const NO_DATE_ICON = {
	icon: Ban,
	className: 'text-muted-foreground',
	strokeWidth: QUICK_ICON_STROKE,
} as const

export const DUE_DATE_SHORTCUT_CHOICES = {
	today: 'quick_today',
	tomorrow: 'quick_tomorrow',
	'this-weekend': 'quick_this_weekend',
	'next-week': 'quick_next_week',
	'next-weekend': 'quick_next_weekend',
} as const satisfies Record<DueDateShortcutId, DatePickerChoice>
