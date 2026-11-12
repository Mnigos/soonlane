import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useNoDateSection } from '../../hooks/use-no-date-section'
import { CollapsibleTaskSection } from './collapsible-task-section'
import { TaskList } from './task-list'

interface UndatedSectionProps {
	/** Inbox on Upcoming and Today, No date in a label's view. */
	heading: 'Inbox' | 'No date'
	tasks: Task[]
	today: CalendarDate
	onComplete: (task: Task) => void
}

/** Open tasks without a due date, in day order; hidden while there are none. */
export function UndatedSection({
	heading,
	tasks,
	today,
	onComplete,
}: Readonly<UndatedSectionProps>) {
	const { isOpen, toggle } = useNoDateSection()

	if (tasks.length === 0) return null

	return (
		<CollapsibleTaskSection
			heading={
				<>
					{heading}

					<span className="font-normal text-muted-foreground">
						{tasks.length}
					</span>
				</>
			}
			id="undated"
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
