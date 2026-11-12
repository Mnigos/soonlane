import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useNoDateSection } from '../../hooks/use-no-date-section'
import { CollapsibleTaskSection } from './collapsible-task-section'
import { TaskList } from './task-list'

interface NoDateSectionProps {
	tasks: Task[]
	today: CalendarDate
	onComplete: (task: Task) => void
}

/** Open tasks without a due date, in day order; hidden while there are none. */
export function NoDateSection({
	tasks,
	today,
	onComplete,
}: Readonly<NoDateSectionProps>) {
	const { isOpen, toggle } = useNoDateSection()

	if (tasks.length === 0) return null

	return (
		<CollapsibleTaskSection
			heading={
				<>
					No date
					<span className="font-normal text-muted-foreground">
						{tasks.length}
					</span>
				</>
			}
			id="no-date"
			isOpen={isOpen}
			onToggle={toggle}
			tasks={tasks}
		>
			<TaskList
				isLoading={false}
				onComplete={onComplete}
				tasks={tasks}
				today={today}
			/>
		</CollapsibleTaskSection>
	)
}
