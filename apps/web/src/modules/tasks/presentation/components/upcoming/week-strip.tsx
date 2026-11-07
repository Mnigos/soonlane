import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import type { WeekStripDay } from '../../../domain/upcoming-view.helper'

interface WeekStripProps {
	days: WeekStripDay[]
	onSelect: (date: CalendarDate) => void
}

export function WeekStrip({ days, onSelect }: Readonly<WeekStripProps>) {
	const activeIndex = days.findIndex(day => day.isActive)

	return (
		<ol className="relative grid grid-cols-7">
			{days.map(day => (
				<li className="flex justify-center" key={day.date}>
					<button
						aria-current={day.isToday ? 'date' : undefined}
						aria-pressed={day.isActive}
						className={cn(
							'flex h-13 cursor-pointer flex-col items-center justify-start gap-0.5 rounded-md px-1.5 pt-1.5 text-caption text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:cursor-default disabled:text-faint-foreground disabled:hover:bg-transparent sm:h-9 sm:flex-row sm:justify-center sm:gap-1 sm:px-2 sm:pt-0 sm:text-sm',
							day.isActive && 'text-foreground',
							day.isToday && 'font-semibold text-foreground'
						)}
						disabled={day.isPast}
						onClick={() => onSelect(day.date)}
						type="button"
					>
						{day.weekday}
						<span
							className={cn(
								'text-sm',
								day.isToday &&
									'rounded-sm bg-primary px-1 text-primary-foreground'
							)}
						>
							{day.dayOfMonth}
						</span>
					</button>
				</li>
			))}

			{activeIndex !== -1 && (
				<li
					aria-hidden
					className="pointer-events-none absolute -bottom-px left-0 flex w-1/7 justify-center motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out"
					style={{ transform: `translateX(${activeIndex * 100}%)` }}
				>
					<span className="h-0.5 w-9 rounded-full bg-foreground sm:w-14" />
				</li>
			)}
		</ol>
	)
}
