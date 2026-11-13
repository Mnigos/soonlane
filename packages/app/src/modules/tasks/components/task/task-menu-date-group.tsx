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
import { CHIP_ICON_STROKE } from '../../helpers/composer-chip.constants'
import { DUE_DATE_SHORTCUT_CHOICES } from '../../helpers/due-date-choice.constants'
import {
	DUE_DATE_SHORTCUT_ICONS,
	NO_DATE_ICON,
} from '../../helpers/due-date-shortcut.constants'
import { getMenuDateShortcuts } from '../../helpers/task-edit.helper'

interface TaskMenuDateGroupProps {
	today: CalendarDate
	onDateChange: (date: CalendarDate, choice: DatePickerChoice) => void
	/** Adds "No date" after the quick dates. */
	onNoDate?: () => void
	noDateHint?: string
	onMoreDates: () => void
}

/** Todoist's "Date" row: the date picker's quick dates as icons, then "More dates" for the full picker. */
export function TaskMenuDateGroup({
	today,
	onDateChange,
	onNoDate,
	noDateHint,
	onMoreDates,
}: Readonly<TaskMenuDateGroupProps>) {
	const shortcuts = getMenuDateShortcuts(today)
	const { icon: NoDateIcon } = NO_DATE_ICON

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

				{onNoDate && (
					<Tooltip
						label={
							<>
								No date{' '}
								<span className="text-muted-foreground">{noDateHint}</span>
							</>
						}
						sharesEscape
					>
						<MenuIconItem
							aria-label={noDateHint ? `No date, ${noDateHint}` : 'No date'}
							label="No date"
							onClick={onNoDate}
						>
							<NoDateIcon
								aria-hidden
								className={cn('size-5.5', NO_DATE_ICON.className)}
								strokeWidth={NO_DATE_ICON.strokeWidth}
							/>
						</MenuIconItem>
					</Tooltip>
				)}

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
