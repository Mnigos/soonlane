import type { CalendarDate } from '@soonlist/domain'
import { getDayHeading } from '../../../domain/day-label.helper'
import { AddTaskRow } from './add-task-row'

interface DaySectionProps {
	date: CalendarDate
	today: CalendarDate
}

export function DaySection({ date, today }: Readonly<DaySectionProps>) {
	const headingId = `day-${date}-heading`

	return (
		<section
			aria-labelledby={headingId}
			className="scroll-mt-44 pt-6"
			id={`day-${date}`}
		>
			<h2
				className="border-b pb-2 text-sm font-semibold text-foreground"
				id={headingId}
			>
				{getDayHeading(date, today)}
			</h2>

			<AddTaskRow />
		</section>
	)
}
