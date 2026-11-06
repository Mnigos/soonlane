import type { CalendarDate } from '@soonlist/domain'
import { cn } from '@soonlist/ui/cn'
import type { WeekStripDay } from '../../../domain/upcoming-view.helper'

interface WeekStripProps {
	days: WeekStripDay[]
	onSelect: (date: CalendarDate) => void
}

/** The active day (in view) gets the red badge; today keeps a purple label and dot wherever the list is. */
export function WeekStrip({ days, onSelect }: Readonly<WeekStripProps>) {
	return (
		<ol className="grid grid-cols-7">
			{days.map(day => (
				<li className="flex justify-center" key={day.date}>
					<button
						aria-current={day.isToday ? 'date' : undefined}
						aria-pressed={day.isActive}
						className={cn(
							'relative flex h-13 cursor-pointer flex-col items-center justify-start gap-0.5 rounded-md px-1.5 pt-1.5 text-caption text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:cursor-default disabled:text-faint-foreground disabled:hover:bg-transparent sm:h-9 sm:flex-row sm:justify-center sm:gap-1 sm:px-2 sm:pt-0 sm:text-sm',
							day.isActive && 'font-semibold text-foreground',
							day.isToday && 'text-today hover:text-today'
						)}
						disabled={day.isPast}
						onClick={() => onSelect(day.date)}
						type="button"
					>
						{day.weekday}
						<span
							className={cn(
								'text-sm',
								day.isActive &&
									'rounded-sm bg-primary px-1 text-primary-foreground'
							)}
						>
							{day.dayOfMonth}
						</span>
						{day.isToday && (
							<span
								aria-hidden
								className="absolute top-1.5 right-1 size-1 rounded-full bg-today sm:top-auto sm:right-auto sm:bottom-0.5 sm:left-1/2 sm:-translate-x-1/2"
							/>
						)}
					</button>
				</li>
			))}
		</ol>
	)
}
