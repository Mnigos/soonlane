import type { CalendarDate } from '@soonlist/domain'
import { getUpcomingView } from '../../../domain/upcoming-view.helper'
import { DaySection } from '../list/day-section'
import { OverdueSection } from '../list/overdue-section'
import { WeekControls } from './week-controls'
import { WeekStrip } from './week-strip'

interface UpcomingPageProps {
	today: CalendarDate
	week?: CalendarDate
}

export function UpcomingPage({ today, week }: Readonly<UpcomingPageProps>) {
	const view = getUpcomingView(today, week)

	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<header className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-background pt-1 md:pt-4">
				<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
					<span aria-hidden />

					<div className="flex flex-col items-center text-center">
						<h1 className="text-xl font-bold">Upcoming</h1>

						<p className="text-label text-muted-foreground">
							{view.monthLabel}
						</p>
					</div>

					<div className="flex justify-end">
						<WeekControls
							nextWeek={view.nextWeek}
							previousWeek={view.isCurrentWeek ? undefined : view.previousWeek}
						/>
					</div>
				</div>

				<WeekStrip days={view.weekDays} />
			</header>

			{view.showsOverdue && <OverdueSection />}

			{view.days.map(date => (
				<DaySection date={date} key={date} today={today} />
			))}
		</main>
	)
}
