import type { Task } from '@soonlane/contracts'
import { type CalendarDate, getDueChipLabel } from '@soonlane/domain'
import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
import { Hash, Inbox, Pencil, X } from 'lucide-react'
import { useId, useState } from 'react'
import { ProjectViewContext } from '../../project-view.context'
import { TaskComposer } from '../composer/task-composer'
import { CompleteTaskButton } from './complete-task-button'
import { GoalProgress } from './goal-progress'
import { TaskActionsMenu } from './task-actions-menu'
import { TaskDescription } from './task-description'
import { TaskMeta } from './task-meta'

interface TaskDetailDialogProps {
	task: Task
	today: CalendarDate
	onComplete: (task: Task) => void
	onClose: () => void
}

/**
 * A task opened from its row, as in Todoist: the whole title and description, its date, labels and goal,
 * with Edit swapping in the edit card. The row passes its live task, so a save shows at once.
 * The header names the project, so the line under the description leaves it out.
 */
export function TaskDetailDialog({
	task,
	today,
	onComplete,
	onClose,
}: Readonly<TaskDetailDialogProps>) {
	const [isEditing, setIsEditing] = useState(false)
	const titleId = useId()
	const due = task.dueDate && getDueChipLabel(task.dueDate, task, today)

	return (
		<Dialog
			className="max-w-2xl rounded-xl"
			label="Task details"
			onClose={onClose}
		>
			{isEditing ? (
				<TaskComposer
					autoFocus={false}
					className="my-0 border-0"
					defaultDueDate={task.dueDate}
					defaultLabels={task.labels}
					onCancel={() => setIsEditing(false)}
					onDeleted={onClose}
					onSaved={() => setIsEditing(false)}
					source="task_row"
					task={task}
					today={today}
				/>
			) : (
				<div className="flex max-h-[85dvh] flex-col">
					<header className="flex items-center gap-2 border-b py-2 pr-2 pl-4">
						<span className="flex min-w-0 items-center gap-1.5 text-label text-muted-foreground">
							{task.project ? (
								<>
									<Hash aria-hidden className="size-4 shrink-0" />

									<span className="ph-mask truncate">{task.project.name}</span>
								</>
							) : (
								<>
									<Inbox aria-hidden className="size-4 shrink-0" />
									Inbox
								</>
							)}
						</span>

						<div className="ml-auto flex items-center gap-1">
							<Button
								onClick={() => setIsEditing(true)}
								size="sm"
								variant="ghost"
							>
								<Pencil aria-hidden />
								Edit
							</Button>

							<TaskActionsMenu onDeleted={onClose} task={task} today={today} />

							<Button
								aria-label="Close"
								onClick={onClose}
								size="icon"
								variant="ghost"
							>
								<X aria-hidden />
							</Button>
						</div>
					</header>

					<div className="flex gap-3 overflow-y-auto px-4 pt-4 pb-6">
						<CompleteTaskButton
							className="mt-1"
							onClick={() => {
								onComplete(task)
								onClose()
							}}
							task={task}
							titleId={titleId}
						/>

						<div className="flex min-w-0 flex-1 flex-col gap-3">
							<h2
								className="ph-mask text-lg leading-7 font-semibold break-words"
								id={titleId}
							>
								{task.title}
							</h2>

							{task.description ? (
								<TaskDescription description={task.description} />
							) : (
								<p className="text-sm text-faint-foreground">No description</p>
							)}

							{task.goal && <GoalProgress goal={task.goal} />}

							<ProjectViewContext value={task.project?.id}>
								<TaskMeta due={due} showsParentAs="link" task={task} />
							</ProjectViewContext>
						</div>
					</div>
				</div>
			)}
		</Dialog>
	)
}
