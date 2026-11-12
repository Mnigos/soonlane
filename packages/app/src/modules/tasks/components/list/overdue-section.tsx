import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@soonlane/ui/components/popover'
import { useRef, useState } from 'react'
import { useCloseEditCard } from '../../hooks/use-close-edit-card'
import { useRescheduleTasks } from '../../hooks/use-reschedule-tasks'
import { DueDatePicker } from '../composer/due-date-picker'
import { CollapsibleTaskSection } from './collapsible-task-section'
import { TaskList } from './task-list'

interface OverdueSectionProps {
	tasks: Task[]
	today: CalendarDate
	isLoading: boolean
	onComplete: (task: Task) => void
}

export function OverdueSection({
	tasks,
	today,
	isLoading,
	onComplete,
}: Readonly<OverdueSectionProps>) {
	const [isOpen, setIsOpen] = useState(true)
	const [isPickerOpen, setIsPickerOpen] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)
	const { rescheduleTasks } = useRescheduleTasks()
	const closeEditCard = useCloseEditCard(tasks)

	return (
		<CollapsibleTaskSection
			action={
				<Popover onOpenChange={setIsPickerOpen} open={isPickerOpen}>
					<PopoverTrigger
						className="cursor-pointer text-sm font-medium text-danger hover:underline disabled:cursor-default disabled:opacity-50 disabled:hover:no-underline"
						disabled={isLoading || tasks.length === 0}
					>
						Reschedule
					</PopoverTrigger>

					<PopoverContent
						align="end"
						aria-label="Reschedule overdue tasks"
						className="flex w-62 flex-col"
						initialFocus={inputRef}
					>
						<DueDatePicker
							inputRef={inputRef}
							onDateChange={dueDate => {
								closeEditCard()
								rescheduleTasks({ ids: tasks.map(({ id }) => id), dueDate })
								setIsPickerOpen(false)
							}}
							today={today}
						/>
					</PopoverContent>
				</Popover>
			}
			heading="Overdue"
			id="overdue"
			isOpen={isOpen}
			onToggle={() => setIsOpen(open => !open)}
			tasks={tasks}
		>
			{!isLoading && tasks.length === 0 ? (
				<p className="py-3 text-sm text-faint-foreground">Nothing overdue.</p>
			) : (
				<TaskList
					isLoading={isLoading}
					onComplete={onComplete}
					tasks={tasks}
					today={today}
				/>
			)}
		</CollapsibleTaskSection>
	)
}
