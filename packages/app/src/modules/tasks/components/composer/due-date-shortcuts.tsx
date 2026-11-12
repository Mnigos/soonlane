import {
	type CalendarDate,
	type DueDateShortcutId,
	getDueDateShortcuts,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { DUE_DATE_SHORTCUT_ICONS } from '../../helpers/due-date-shortcut.constants'

interface DueDateShortcutsProps {
	selected?: CalendarDate
	today: CalendarDate
	onSelect: (date: CalendarDate, id: DueDateShortcutId) => void
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
				const {
					icon: Icon,
					className,
					strokeWidth,
				} = DUE_DATE_SHORTCUT_ICONS[id]

				return (
					<li key={id}>
						<button
							className="flex h-8 w-full cursor-pointer items-center gap-3 pr-4 pl-3 text-label font-medium text-foreground transition-colors outline-none hover:bg-hover focus-visible:bg-hover"
							onClick={() => onSelect(date, id)}
							type="button"
						>
							<Icon
								aria-hidden
								className={cn('size-5.5 shrink-0', className)}
								strokeWidth={strokeWidth}
							/>
							{label}
							<span className="ml-auto font-normal text-secondary-foreground">
								{hint}
							</span>
						</button>
					</li>
				)
			})}
		</ul>
	)
}
