import type { ComponentType, SVGProps } from 'react'
import type { DueDateShortcutId } from '../../domain/due-date-shortcut.helper'
import {
	NextWeekIcon,
	TomorrowIcon,
	WeekendIcon,
} from '../components/composer/date-picker-icons'
import { DueCalendarIcon } from '../components/composer/due-calendar-icon'

/** Todoist's quick date icons: green calendar, orange sun, purple arrow, blue couch. */
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
