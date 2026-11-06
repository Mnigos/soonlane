import {
	CalendarDays,
	type LucideIcon,
	Sofa,
	SquareArrowRight,
	Sun,
} from 'lucide-react'
import type { DueDateShortcutId } from '../../domain/due-date-shortcut.helper'

/** Todoist's shortcut icons in the due colors; the weekend sofa stays grey because blue is reserved for P3. */
export const DUE_DATE_SHORTCUT_ICONS = {
	today: { icon: CalendarDays, className: 'text-due-today' },
	tomorrow: { icon: Sun, className: 'text-due-tomorrow' },
	'this-weekend': { icon: Sofa, className: 'text-muted-foreground' },
	'next-week': { icon: SquareArrowRight, className: 'text-due-week' },
	'next-weekend': { icon: Sofa, className: 'text-muted-foreground' },
} as const satisfies Record<
	DueDateShortcutId,
	{ icon: LucideIcon; className: string }
>
