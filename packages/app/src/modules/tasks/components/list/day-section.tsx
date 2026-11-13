import type { Task } from '@soonlane/contracts'
import { type CalendarDate, getDayHeading } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { type Ref, useRef, useState } from 'react'
import { getHostPorts } from '../../../../host-ports.client'
import { useOpenEditor } from '../../hooks/use-open-editor'
import { TaskComposer } from '../composer/task-composer'
import { AddTaskRow } from './add-task-row'
import { TaskList } from './task-list'

interface DaySectionProps {
	date: CalendarDate
	today: CalendarDate
	tasks: Task[]
	isLoading: boolean
	onComplete: (task: Task) => void
	/** Off in a label or project view, which has one Add task row at its bottom. */
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
	const { capture } = getHostPorts()
	const { openEditorId, setOpenEditorId } = useOpenEditor()
	const isAdding = openEditorId === date
	const [shouldFocusAddTask, setShouldFocusAddTask] = useState(false)
	const hasCreatedRef = useRef(false)
	const headingId = `day-${date}-heading`

	function openComposer() {
		hasCreatedRef.current = false
		setOpenEditorId(date)
		setShouldFocusAddTask(false)
		capture('composer_opened', { source: 'day_row' })
	}

	function closeComposer() {
		if (!hasCreatedRef.current)
			capture('composer_cancelled', { source: 'day_row' })
		setOpenEditorId(undefined)
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
