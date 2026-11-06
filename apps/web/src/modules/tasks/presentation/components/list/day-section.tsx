import type { CalendarDate } from '@soonlist/domain'
import type { Ref } from 'react'
import { getDayHeading } from '../../../domain/day-label.helper'
import { AddTaskRow } from './add-task-row'

interface DaySectionProps {
	date: CalendarDate
	today: CalendarDate
	ref?: Ref<HTMLElement>
}

export function DaySection({ date, today, ref }: Readonly<DaySectionProps>) {
	const headingId = `day-${date}-heading`

	return (
		<section
			aria-labelledby={headingId}
			className="pt-6"
			id={`day-${date}`}
			ref={ref}
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
