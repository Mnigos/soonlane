import type { CalendarDate } from '@soonlist/domain'
import {
	formatDayMonth,
	formatWeekday,
} from '../../domain/calendar-date.helper'
import { DaySection } from './list/day-section'
import { OverdueSection } from './list/overdue-section'

interface TodayPageProps {
	today: CalendarDate
}

export function TodayPage({ today }: Readonly<TodayPageProps>) {
	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<header className="flex flex-col pt-1 md:pt-4">
				<h1 className="text-xl font-bold">Today</h1>
				<p className="text-label text-muted-foreground">
					{formatWeekday(today, 'long')}, {formatDayMonth(today)}
				</p>
			</header>
			<OverdueSection />
			<DaySection date={today} today={today} />
		</main>
	)
}
