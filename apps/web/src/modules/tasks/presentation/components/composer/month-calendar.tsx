import type { CalendarDate } from '@soonlist/domain'
import { cn } from '@soonlist/ui/cn'
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react'
import { type KeyboardEvent, useId, useState } from 'react'
import {
	addDays,
	addMonths,
	formatLongDate,
	formatMonthShortYear,
	getDayOfMonth,
	getMonthStart,
	isBefore,
	shiftMonths,
} from '../../../domain/calendar-date.helper'
import { getMonthWeeks } from '../../../domain/month-calendar.helper'

interface MonthCalendarProps {
	selected: CalendarDate
	today: CalendarDate
	onSelect: (date: CalendarDate) => void
}

const WEEKDAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const KEY_STEPS: Record<string, number> = {
	ArrowLeft: -1,
	ArrowRight: 1,
	ArrowUp: -7,
	ArrowDown: 7,
}
const NAV_BUTTON_CLASS =
	'flex size-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4'

function focusElement(element: HTMLButtonElement | null) {
	element?.focus()
}

/**
 * A month grid like Todoist's: today in red, the chosen day on a red circle,
 * past days dimmed. Arrow keys move by day and week, Page Up and Page Down by
 * month; only one day is in the tab order.
 */
export function MonthCalendar({
	selected,
	today,
	onSelect,
}: Readonly<MonthCalendarProps>) {
	const initial = isBefore(selected, today) ? today : selected
	const [month, setMonth] = useState(getMonthStart(initial))
	const [focused, setFocused] = useState(initial)
	const [isKeyboardFocus, setIsKeyboardFocus] = useState(false)
	const monthLabelId = useId()
	const firstMonth = getMonthStart(today)
	const firstSelectable = isBefore(month, today) ? today : month
	const tabbable = getMonthStart(focused) === month ? focused : firstSelectable

	function showMonth(next: CalendarDate) {
		setMonth(next)
		setIsKeyboardFocus(false)
	}

	function moveFocus(date: CalendarDate) {
		const next = isBefore(date, today) ? today : date

		setFocused(next)
		setMonth(getMonthStart(next))
		setIsKeyboardFocus(true)
	}

	function onDayKeyDown(
		event: KeyboardEvent<HTMLButtonElement>,
		date: CalendarDate
	) {
		const step = KEY_STEPS[event.key]

		if (step !== undefined) moveFocus(addDays(date, step))
		else if (event.key === 'PageUp') moveFocus(shiftMonths(date, -1))
		else if (event.key === 'PageDown') moveFocus(shiftMonths(date, 1))
		else return

		event.preventDefault()
	}

	return (
		<div className="flex flex-col gap-2 px-3 py-2">
			<div className="flex items-center justify-between">
				<p
					aria-live="polite"
					className="text-sm font-semibold"
					id={monthLabelId}
				>
					{formatMonthShortYear(month)}
				</p>

				<div className="flex items-center">
					<button
						aria-label="Previous month"
						className={NAV_BUTTON_CLASS}
						disabled={month === firstMonth}
						onClick={() => showMonth(addMonths(month, -1))}
						type="button"
					>
						<ChevronLeft aria-hidden />
					</button>

					<button
						aria-label="This month"
						className={cn(NAV_BUTTON_CLASS, '[&_svg]:size-3')}
						disabled={month === firstMonth}
						onClick={() => showMonth(firstMonth)}
						type="button"
					>
						<Circle aria-hidden />
					</button>

					<button
						aria-label="Next month"
						className={NAV_BUTTON_CLASS}
						onClick={() => showMonth(addMonths(month, 1))}
						type="button"
					>
						<ChevronRight aria-hidden />
					</button>
				</div>
			</div>

			<fieldset
				aria-labelledby={monthLabelId}
				className="flex min-w-0 flex-col"
			>
				<div
					aria-hidden
					className="grid grid-cols-7 text-center text-caption text-muted-foreground"
				>
					{WEEKDAY_INITIALS.map((weekday, index) => (
						<span className="py-1" key={`${weekday}-${String(index)}`}>
							{weekday}
						</span>
					))}
				</div>

				{getMonthWeeks(month).map(week => (
					<div
						className="grid grid-cols-7 justify-items-center"
						key={week.find(Boolean)}
					>
						{week.map((date, index) => {
							if (!date) return <span key={`blank-${String(index)}`} />

							const isPast = isBefore(date, today)
							const isSelected = date === selected

							return (
								<button
									aria-current={date === today ? 'date' : undefined}
									aria-label={formatLongDate(date)}
									aria-pressed={isSelected}
									className={cn(
										'flex size-8 cursor-pointer items-center justify-center rounded-full text-label text-foreground transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:text-faint-foreground',
										date === today && 'font-semibold text-danger',
										isSelected &&
											'bg-primary font-semibold text-primary-foreground hover:bg-primary-hover'
									)}
									disabled={isPast}
									key={date}
									onClick={() => onSelect(date)}
									onKeyDown={event => onDayKeyDown(event, date)}
									ref={
										date === tabbable && isKeyboardFocus
											? focusElement
											: undefined
									}
									tabIndex={date === tabbable ? 0 : -1}
									type="button"
								>
									{getDayOfMonth(date)}
								</button>
							)
						})}
					</div>
				))}
			</fieldset>
		</div>
	)
}
