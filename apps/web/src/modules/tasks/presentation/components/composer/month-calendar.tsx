import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react'
import { type KeyboardEvent, useCallback, useState } from 'react'
import {
	addDays,
	addMonths,
	formatMonthShortYear,
	getMonthStart,
	isBefore,
	shiftMonths,
} from '../../../domain/calendar-date.helper'
import {
	getCalendarMonths,
	getMonthOffset,
} from '../../../domain/month-calendar.helper'
import { MonthGrid } from './month-grid'

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
	'flex size-7 cursor-pointer items-center justify-center rounded-md text-secondary-foreground transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-30 [&_svg]:size-4'

/** Where each month's first week sits in the scroller, just below its "Dec" heading. */
function getMonthTops(container: HTMLElement) {
	return [...container.querySelectorAll<HTMLElement>('[data-month]')].map(
		section =>
			section.querySelector<HTMLElement>('[data-week]')?.offsetTop ??
			section.offsetTop
	)
}

/**
 * Todoist's scrolling calendar: a year of months from today's week, under a
 * header that names the month at the top. Today is red, the chosen day sits
 * on a red circle and past days are dimmed. Arrow keys move by day and week,
 * Page Up and Page Down by month; only one day is in the tab order.
 */
export function MonthCalendar({
	selected,
	today,
	onSelect,
}: Readonly<MonthCalendarProps>) {
	const initial = isBefore(selected, today) ? today : selected
	const months = getCalendarMonths(today, initial)
	const lastDay = addDays(addMonths(months.at(-1) ?? initial, 1), -1)
	const initialIndex = getMonthOffset(today, initial)
	const [shownIndex, setShownIndex] = useState(initialIndex)
	const [focused, setFocused] = useState(initial)
	const [isKeyboardFocus, setIsKeyboardFocus] = useState(false)
	const [scroller, setScroller] = useState<HTMLDivElement | null>(null)
	// Stable, so a re-render does not scroll back; it opens on the chosen day's month, as Todoist does.
	const attachScroller = useCallback(
		(container: HTMLDivElement | null) => {
			setScroller(container)
			const top = container ? getMonthTops(container)[initialIndex] : undefined
			if (top !== undefined) container?.scrollTo({ top })
		},
		[initialIndex]
	)

	function scrollToMonth(index: number) {
		const month = months[index]
		const top = scroller ? getMonthTops(scroller)[index] : undefined

		if (!month || top === undefined) return

		scroller?.scrollTo({ top })
		// The tab stop follows the arrows, so Tab lands in the month on screen; focus stays on the arrow.
		setFocused(
			getMonthStart(initial) === month
				? initial
				: isBefore(month, today)
					? today
					: month
		)
		setIsKeyboardFocus(false)
	}

	function showMonthAtTop(container: HTMLElement) {
		const index = getMonthTops(container).findLastIndex(
			top => top <= container.scrollTop + 1
		)

		setShownIndex(Math.max(index, 0))
	}

	function moveFocus(date: CalendarDate) {
		let next = date
		if (isBefore(next, today)) next = today
		if (isBefore(lastDay, next)) next = lastDay

		setFocused(next)
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
		<div className="flex flex-col">
			<div className="flex items-center justify-between pt-1.5 pr-2.5 pb-1 pl-4">
				<p aria-live="polite" className="text-label font-bold">
					{formatMonthShortYear(months[shownIndex] ?? initial)}
				</p>

				<div className="flex items-center gap-1">
					<button
						aria-label="Previous month"
						className={NAV_BUTTON_CLASS}
						disabled={shownIndex === 0}
						onClick={() => scrollToMonth(shownIndex - 1)}
						type="button"
					>
						<ChevronLeft aria-hidden strokeWidth={1.5} />
					</button>

					<button
						aria-label="This month"
						className={cn(NAV_BUTTON_CLASS, '[&_svg]:size-2.5')}
						disabled={shownIndex === 0}
						onClick={() => scrollToMonth(0)}
						type="button"
					>
						<Circle aria-hidden strokeWidth={2.5} />
					</button>

					<button
						aria-label="Next month"
						className={NAV_BUTTON_CLASS}
						disabled={shownIndex === months.length - 1}
						onClick={() => scrollToMonth(shownIndex + 1)}
						type="button"
					>
						<ChevronRight aria-hidden strokeWidth={1.5} />
					</button>
				</div>
			</div>

			<div
				aria-hidden
				className="grid h-4.5 grid-cols-7 items-center px-2.5 text-center text-micro text-secondary-foreground"
			>
				{WEEKDAY_INITIALS.map((weekday, index) => (
					<span key={`${weekday}-${String(index)}`}>{weekday}</span>
				))}
			</div>

			<div
				className="relative h-47 overflow-y-auto overscroll-contain"
				onScroll={event => showMonthAtTop(event.currentTarget)}
				ref={attachScroller}
			>
				{months.map(month => (
					<MonthGrid
						key={month}
						month={month}
						onDayKeyDown={onDayKeyDown}
						onSelect={onSelect}
						selected={selected}
						shouldFocus={isKeyboardFocus}
						tabbable={focused}
						today={today}
					/>
				))}
			</div>
		</div>
	)
}
