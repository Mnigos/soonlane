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
		<main className="flex flex-1 flex-col">
			<header className="sticky top-0 z-10 border-b bg-background">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-6 pt-1 md:px-10">
					<div className="flex items-center justify-between gap-4">
						<div className="flex flex-col">
							<h1 className="text-xl font-bold">Upcoming</h1>
							<p className="text-label text-muted-foreground">
								{view.monthLabel}
							</p>
						</div>
						<WeekControls
							nextWeek={view.nextWeek}
							previousWeek={view.isCurrentWeek ? undefined : view.previousWeek}
						/>
					</div>
					<WeekStrip days={view.weekDays} />
				</div>
			</header>
			<div className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
				{view.showsOverdue && <OverdueSection />}
				{view.days.map(date => (
					<DaySection date={date} key={date} today={today} />
				))}
			</div>
		</main>
	)
}
