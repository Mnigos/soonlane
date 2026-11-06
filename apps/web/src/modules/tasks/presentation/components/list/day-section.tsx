import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { type Ref, useState } from 'react'
import { getDayHeading } from '../../../domain/day-label.helper'
import { TaskComposer } from '../composer/task-composer'
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
	const [shouldFocusAddTask, setShouldFocusAddTask] = useState(false)
	const headingId = `day-${date}-heading`

	function closeComposer() {
		setIsAdding(false)
		setShouldFocusAddTask(true)
	}

	return (
		<section
			aria-labelledby={headingId}
			className="pt-6"
			id={`day-${date}`}
			ref={ref}
		>
			<h2
				className={cn(
					'border-b pb-2 text-sm font-semibold',
					date === today ? 'text-foreground' : 'text-muted-foreground'
				)}
				id={headingId}
			>
				{getDayHeading(date, today)}
			</h2>

			<TaskList
				isLoading={isLoading}
				onComplete={onComplete}
				tasks={tasks}
				today={today}
			/>

			{isAdding ? (
				<TaskComposer
					defaultDueDate={date}
					onCancel={closeComposer}
					today={today}
				/>
			) : (
				<AddTaskRow
					autoFocus={shouldFocusAddTask}
					onClick={() => setIsAdding(true)}
				/>
			)}
		</section>
	)
}
