import { Link } from '@tanstack/react-router'
import { cn } from '@/utils/cn.util'
import type { WeekStripDay } from '../../../domain/upcoming-view.helper'

interface WeekStripProps {
	days: WeekStripDay[]
}

export function WeekStrip({ days }: Readonly<WeekStripProps>) {
	return (
		<ol className="grid grid-cols-7">
			{days.map(day => (
				<li className="flex justify-center" key={day.date}>
					{day.isPast ? (
						<span className="flex h-9 items-center gap-1 text-sm text-faint-foreground">
							{day.weekday} {day.dayOfMonth}
						</span>
					) : (
						<Link
							activeOptions={{ includeHash: true }}
							aria-current={day.isToday ? 'date' : undefined}
							className={cn(
								'flex h-9 items-center gap-1 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground',
								day.isToday && 'font-semibold text-foreground'
							)}
							hash={`day-${day.date}`}
							hashScrollIntoView={{ behavior: 'smooth', block: 'start' }}
							search={previous => previous}
							to="."
						>
							{day.weekday}
							<span
								className={cn(
									day.isToday &&
										'rounded-sm bg-primary px-1 text-primary-foreground'
								)}
							>
								{day.dayOfMonth}
							</span>
						</Link>
					)}
				</li>
			))}
		</ol>
	)
}
