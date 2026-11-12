import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useState } from 'react'
import { CompletedTaskList } from './completed-task-list'
import { SectionToggle } from './section-toggle'

interface CompletedSectionProps {
	tasks: Task[]
	today: CalendarDate
}

/** Today's completed tasks, collapsed on every visit; the count stays visible. */
export function CompletedSection({
	tasks,
	today,
}: Readonly<CompletedSectionProps>) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<section aria-labelledby="completed-heading" className="pt-4">
			<h2
				className="border-b pb-2 text-sm font-semibold"
				id="completed-heading"
			>
				<SectionToggle
					controls="completed-tasks"
					isOpen={isOpen}
					onToggle={() => setIsOpen(open => !open)}
				>
					Completed
					<span className="font-normal text-muted-foreground">
						{tasks.length}
					</span>
				</SectionToggle>
			</h2>

			{isOpen && (
				<CompletedTaskList id="completed-tasks" tasks={tasks} today={today} />
			)}
		</section>
	)
}
