import {
	type CalendarDate,
	type DueDateShortcutId,
	getDueDateShortcuts,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	DUE_DATE_SHORTCUT_ICONS,
	NO_DATE_ICON,
} from '../../helpers/due-date-shortcut.constants'

interface DueDateShortcutsProps {
	selected?: CalendarDate
	today: CalendarDate
	onSelect: (date: CalendarDate, id: DueDateShortcutId) => void
	/** Adds "No date" after the quick dates while a date is selected. */
	onNoDate?: () => void
	noDateHint?: string
}

/** Today, Tomorrow, the weekend and next week with their weekday hints; the chosen day is left out. */
export function DueDateShortcuts({
	selected,
	today,
	onSelect,
	onNoDate,
	noDateHint,
}: Readonly<DueDateShortcutsProps>) {
	const rows = [
		...getDueDateShortcuts(today)
			.filter(({ date }) => date !== selected)
			.map(({ id, label, date, hint }) => ({
				id,
				label,
				hint,
				...DUE_DATE_SHORTCUT_ICONS[id],
				onClick: () => onSelect(date, id),
			})),
		...(onNoDate && selected
			? [
					{
						id: 'no-date',
						label: 'No date',
						hint: noDateHint,
						...NO_DATE_ICON,
						onClick: onNoDate,
					},
				]
			: []),
	]

	return (
		<ul className="flex flex-col border-b py-1">
			{rows.map(
				({ id, label, hint, icon: Icon, className, strokeWidth, onClick }) => (
					<li key={id}>
						<button
							className="flex h-8 w-full cursor-pointer items-center gap-3 pr-4 pl-3 text-label font-medium text-foreground transition-colors outline-none hover:bg-hover focus-visible:bg-hover"
							onClick={onClick}
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
			)}
		</ul>
	)
}
