import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import type { KeyboardEvent } from 'react'
import {
	formatLongDate,
	formatMonthYear,
	getDayOfMonth,
	getMonthStart,
	isBefore,
	isWeekend,
} from '../../../domain/calendar-date.helper'
import {
	formatMonthHeading,
	getVisibleWeeks,
} from '../../../domain/month-calendar.helper'

interface MonthGridProps {
	month: CalendarDate
	selected?: CalendarDate
	today: CalendarDate
	tabbable: CalendarDate
	shouldFocus: boolean
	onSelect: (date: CalendarDate) => void
	onDayKeyDown: (
		event: KeyboardEvent<HTMLButtonElement>,
		date: CalendarDate
	) => void
}

function focusElement(element: HTMLButtonElement | null) {
	element?.focus()
}

function getDayTone(date: CalendarDate, today: CalendarDate) {
	if (isBefore(date, today)) return 'text-faint-foreground'
	if (date === today) return 'font-semibold text-primary'
	if (isWeekend(date)) return 'text-secondary-foreground'

	return 'text-foreground'
}

// The last month is tall enough to scroll its first week to the top.
export function MonthGrid({
	month,
	selected,
	today,
	tabbable,
	shouldFocus,
	onSelect,
	onDayKeyDown,
}: Readonly<MonthGridProps>) {
	return (
		<fieldset
			aria-label={formatMonthYear(month)}
			className="min-w-0 last:min-h-[calc(100%+2rem)]"
			data-month={month}
		>
			{month !== getMonthStart(today) && (
				<p
					aria-hidden
					className="flex h-8 items-center pt-0.75 pl-4 text-label font-bold"
				>
					{formatMonthHeading(month, today)}
				</p>
			)}

			{getVisibleWeeks(month, today).map(week => (
				<div
					className="grid grid-cols-7 px-2.5"
					data-week
					key={week.find(Boolean)}
				>
					{week.map((date, index) => {
						if (!date) return <span key={`blank-${String(index)}`} />

						const isSelected = date === selected

						return (
							<button
								aria-current={date === today ? 'date' : undefined}
								aria-label={formatLongDate(date)}
								aria-pressed={isSelected}
								className="group flex h-8 cursor-pointer items-center justify-center outline-none disabled:pointer-events-none"
								disabled={isBefore(date, today)}
								key={date}
								onClick={() => onSelect(date)}
								onKeyDown={event => onDayKeyDown(event, date)}
								ref={
									date === tabbable && shouldFocus ? focusElement : undefined
								}
								tabIndex={date === tabbable ? 0 : -1}
								type="button"
							>
								<span
									className={cn(
										'relative flex size-6 items-center justify-center rounded-full text-label transition-colors group-hover:bg-hover group-focus-visible:outline-2 group-focus-visible:outline-primary',
										getDayTone(date, today),
										isSelected &&
											'bg-primary font-semibold text-primary-foreground group-hover:bg-primary-hover'
									)}
								>
									{getDayOfMonth(date)}

									{date === today && (
										<span className="absolute bottom-0 size-0.75 rounded-full bg-secondary-foreground" />
									)}
								</span>
							</button>
						)
					})}
				</div>
			))}
		</fieldset>
	)
}
