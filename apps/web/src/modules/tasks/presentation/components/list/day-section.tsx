import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { type Ref, useRef, useState } from 'react'
import { capture } from '@/modules/analytics/presentation/analytics.client'
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
	hasAddTask?: boolean
	ref?: Ref<HTMLElement>
}

export function DaySection({
	date,
	today,
	tasks,
	isLoading,
	onComplete,
	hasAddTask = true,
	ref,
}: Readonly<DaySectionProps>) {
	const [isAdding, setIsAdding] = useState(false)
	const [shouldFocusAddTask, setShouldFocusAddTask] = useState(false)
	// The composer stays open after a create; closing it then is not a cancel.
	const hasCreatedRef = useRef(false)
	const headingId = `day-${date}-heading`

	function openComposer() {
		hasCreatedRef.current = false
		setIsAdding(true)
		capture('composer_opened', { source: 'day_row' })
	}

	function closeComposer() {
		if (!hasCreatedRef.current)
			capture('composer_cancelled', { source: 'day_row' })
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

			{hasAddTask &&
				(isAdding ? (
					<TaskComposer
						defaultDueDate={date}
						onCancel={closeComposer}
						onCreated={() => {
							hasCreatedRef.current = true
						}}
						source="day_row"
						today={today}
					/>
				) : (
					<AddTaskRow autoFocus={shouldFocusAddTask} onClick={openComposer} />
				))}
		</section>
	)
}
