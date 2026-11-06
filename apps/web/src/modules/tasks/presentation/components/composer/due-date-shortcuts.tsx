import type { CalendarDate } from '@soonlist/domain'
import { cn } from '@soonlist/ui/cn'
import { getDueDateShortcuts } from '../../../domain/due-date-shortcut.helper'
import { DUE_DATE_SHORTCUT_ICONS } from '../../helpers/due-date-shortcut.constants'

interface DueDateShortcutsProps {
	selected: CalendarDate
	today: CalendarDate
	onSelect: (date: CalendarDate) => void
}

/** Today, Tomorrow, the weekend and next week with their weekday hints; the chosen day is left out. */
export function DueDateShortcuts({
	selected,
	today,
	onSelect,
}: Readonly<DueDateShortcutsProps>) {
	const shortcuts = getDueDateShortcuts(today).filter(
		({ date }) => date !== selected
	)

	return (
		<ul className="flex flex-col border-b py-1">
			{shortcuts.map(({ id, label, date, hint }) => {
				const { icon: Icon, className } = DUE_DATE_SHORTCUT_ICONS[id]

				return (
					<li key={id}>
						<button
							className="flex h-8 w-full cursor-pointer items-center gap-2.5 px-3 text-sm text-foreground transition-colors outline-none hover:bg-hover focus-visible:bg-hover"
							onClick={() => onSelect(date)}
							type="button"
						>
							<Icon aria-hidden className={cn('size-4', className)} />
							{label}
							<span className="ml-auto text-label text-muted-foreground">
								{hint}
							</span>
						</button>
					</li>
				)
			})}
		</ul>
	)
}
