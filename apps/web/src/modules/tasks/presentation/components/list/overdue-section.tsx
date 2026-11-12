import { DueDatePicker } from '@soonlane/app/tasks/components/composer/due-date-picker'
import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@soonlane/ui/components/popover'
import { useRef, useState } from 'react'
import { useOpenEditor } from '../../hooks/use-open-editor'
import { useRescheduleTasks } from '../../hooks/use-reschedule-tasks'
import { SectionToggle } from './section-toggle'
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
	const { openEditorId, setOpenEditorId } = useOpenEditor()

	/** An edit card whose row is hidden or moved away would reopen wherever the task shows up next. */
	function closeEditCard() {
		if (tasks.some(({ id }) => id === openEditorId)) setOpenEditorId(undefined)
	}

	return (
		<section aria-labelledby="overdue-heading" className="pt-4">
			<div className="flex items-center justify-between gap-4 border-b pb-2">
				<h2 className="text-sm font-semibold" id="overdue-heading">
					<SectionToggle
						controls="overdue-tasks"
						isOpen={isOpen}
						onToggle={() => {
							closeEditCard()
							setIsOpen(open => !open)
						}}
					>
						Overdue
					</SectionToggle>
				</h2>

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
			</div>

			{isOpen && (
				<div id="overdue-tasks">
					{!isLoading && tasks.length === 0 ? (
						<p className="py-3 text-sm text-faint-foreground">
							Nothing overdue.
						</p>
					) : (
						<TaskList
							isLoading={isLoading}
							onComplete={onComplete}
							tasks={tasks}
							today={today}
						/>
					)}
				</div>
			)}
		</section>
	)
}
