import type { Task } from '@soonlist/contracts'
import type { CalendarDate } from '@soonlist/domain'
import { type Ref, useState } from 'react'
import { getDayHeading } from '../../../domain/day-label.helper'
import { TaskQuickAdd } from '../task/task-quick-add'
import { AddTaskRow } from './add-task-row'
import { TaskList } from './task-list'

interface DaySectionProps {
	date: CalendarDate
	today: CalendarDate
	tasks: Task[]
	isLoading: boolean
	onComplete: (task: Task) => void
	ref?: Ref<HTMLElement>
}

export function DaySection({
	date,
	today,
	tasks,
	isLoading,
	onComplete,
	ref,
}: Readonly<DaySectionProps>) {
	const [isAdding, setIsAdding] = useState(false)
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

			<TaskList isLoading={isLoading} onComplete={onComplete} tasks={tasks} />

			{isAdding ? (
				<TaskQuickAdd
					defaultDueDate={date}
					onCancel={() => setIsAdding(false)}
				/>
			) : (
				<AddTaskRow onClick={() => setIsAdding(true)} />
			)}
		</section>
	)
}
