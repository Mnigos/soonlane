import type { CalendarDate } from '@soonlist/domain'
import {
	getUpcomingDays,
	getWeekStrip,
} from '../../../domain/upcoming-view.helper'
import { useActiveDay } from '../../hooks/use-active-day'
import { DaySection } from '../list/day-section'
import { OverdueSection } from '../list/overdue-section'
import { WeekControls } from './week-controls'
import { WeekStrip } from './week-strip'

interface UpcomingPageProps {
	today: CalendarDate
}

export function UpcomingPage({ today }: Readonly<UpcomingPageProps>) {
	const days = getUpcomingDays(today)
	const { activeDay, headerRef, sectionRef, scrollToDay } = useActiveDay(today)
	const strip = getWeekStrip(today, activeDay)
	const activeIndex = days.indexOf(activeDay)
	const previousDay = days[activeIndex - 1]
	const nextDay = days[activeIndex + 1]

	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<header
				className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-background pt-1 md:pt-4"
				ref={headerRef}
			>
				<div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
					<span aria-hidden />

					<div className="flex flex-col items-center text-center">
						<h1 className="text-xl font-bold">Upcoming</h1>

						<p className="text-label text-muted-foreground">
							{strip.monthLabel}
						</p>
					</div>

					<div className="flex justify-end">
						<WeekControls
							onNext={nextDay && (() => scrollToDay(nextDay))}
							onPrevious={previousDay && (() => scrollToDay(previousDay))}
							onToday={() => scrollToDay(today)}
						/>
					</div>
				</div>

				<WeekStrip days={strip.days} onSelect={scrollToDay} />
			</header>

			<OverdueSection />

			{days.map(date => (
				<DaySection
					date={date}
					key={date}
					ref={sectionRef(date)}
					today={today}
				/>
			))}
		</main>
	)
}
