import type { DatePickerChoice } from '@soonlane/analytics'
import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	MenuGroup,
	MenuGroupLabel,
	MenuIconItem,
	MenuRow,
} from '@soonlane/ui/components/menu'
import { Tooltip } from '@soonlane/ui/components/tooltip'
import { Ellipsis } from 'lucide-react'
import { getDueDateShortcuts } from '../../../domain/due-date-shortcut.helper'
import { CHIP_ICON_STROKE } from '../../helpers/composer-chip.constants'
import {
	DUE_DATE_SHORTCUT_CHOICES,
	DUE_DATE_SHORTCUT_ICONS,
} from '../../helpers/due-date-shortcut.constants'

interface TaskMenuDateGroupProps {
	today: CalendarDate
	onDateChange: (date: CalendarDate, choice: DatePickerChoice) => void
	onMoreDates: () => void
}

/** Todoist's "Date" row: the date picker's quick dates as icons, then "More dates" for the full picker. */
export function TaskMenuDateGroup({
	today,
	onDateChange,
	onMoreDates,
}: Readonly<TaskMenuDateGroupProps>) {
	const shortcuts = getDueDateShortcuts(today).filter(
		({ id }) => id !== 'next-weekend'
	)

	return (
		<MenuGroup>
			<MenuGroupLabel>Date</MenuGroupLabel>

			<MenuRow>
				{shortcuts.map(({ id, label, date, hint }) => {
					const {
						icon: Icon,
						className,
						strokeWidth,
					} = DUE_DATE_SHORTCUT_ICONS[id]

					return (
						<Tooltip
							key={id}
							sharesEscape
							label={
								<>
									{label} <span className="text-muted-foreground">{hint}</span>
								</>
							}
						>
							<MenuIconItem
								aria-label={`${label}, ${hint}`}
								label={label}
								onClick={() =>
									onDateChange(date, DUE_DATE_SHORTCUT_CHOICES[id])
								}
							>
								<Icon
									aria-hidden
									className={cn('size-5.5', className)}
									strokeWidth={strokeWidth}
								/>
							</MenuIconItem>
						</Tooltip>
					)
				})}

				<Tooltip label="More dates" sharesEscape>
					<MenuIconItem
						aria-label="More dates"
						label="More dates"
						className="text-secondary-foreground"
						onClick={onMoreDates}
					>
						<Ellipsis
							aria-hidden
							className="size-5"
							strokeWidth={CHIP_ICON_STROKE}
						/>
					</MenuIconItem>
				</Tooltip>
			</MenuRow>
		</MenuGroup>
	)
}
