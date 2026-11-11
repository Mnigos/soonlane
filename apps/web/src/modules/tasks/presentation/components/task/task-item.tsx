import type { Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	getDueLabel,
	formatRepeatRule,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Calendar, Check, Tag } from 'lucide-react'
import { useId, useState } from 'react'
import { LABEL_COLOR_CLASSES } from '@/modules/labels/presentation/helpers/label-color.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'
import { PRIORITY_CIRCLE_CLASSES } from '../../helpers/task-priority.constants'
import { useOpenEditor } from '../../hooks/use-open-editor'
import { RepeatIcon } from '../composer/date-picker-icons'
import { TaskComposer } from '../composer/task-composer'
import { GoalProgress } from './goal-progress'
import { LogProgressControls } from './log-progress-controls'
import { TaskRowMenu } from './task-row-menu'

interface TaskItemProps {
	task: Task
	today: CalendarDate
	onComplete: (task: Task) => void
}

/** Row controls show on hover and focus, always on touch screens; the negative margin keeps the row height. */
const ROW_CONTROL_CLASS =
	'-my-1.5 opacity-0 group-focus-within/task:opacity-100 group-hover/task:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100'

export function TaskItem({ task, today, onComplete }: Readonly<TaskItemProps>) {
	const { openEditorId, setOpenEditorId } = useOpenEditor()
	const isEditing = openEditorId === task.id
	const [shouldFocusMenu, setShouldFocusMenu] = useState(false)
	const due = getDueLabel(task.dueDate, task.dueTime, today)
	const repeatText = task.repeat && formatRepeatRule(task.repeat, 'long')
	const buttonId = useId()
	const titleId = useId()

	function openComposer() {
		setOpenEditorId(task.id)
		setShouldFocusMenu(false)
	}

	function closeComposer() {
		setOpenEditorId(undefined)
		setShouldFocusMenu(true)
	}

	if (isEditing)
		return (
			<li>
				<TaskComposer
					defaultDueDate={task.dueDate}
					defaultLabels={task.labels}
					onCancel={closeComposer}
					onSaved={closeComposer}
					source="task_row"
					task={task}
					today={today}
				/>
			</li>
		)

	// "Complete <title>" without the title in an attribute, which replay masking would not hide.
	return (
		<li className="group/task flex gap-2.5 border-b py-2.5">
			<button
				aria-label="Complete"
				aria-labelledby={`${buttonId} ${titleId}`}
				className={cn(
					'group mt-0.5 flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors',
					PRIORITY_CIRCLE_CLASSES[task.priority]
				)}
				id={buttonId}
				onClick={() => onComplete(task)}
				type="button"
			>
				<Check
					aria-hidden
					className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
					strokeWidth={3}
				/>
			</button>

			<div className="flex min-w-0 flex-1 flex-col gap-0.5">
				<p className="ph-mask text-sm text-foreground" id={titleId}>
					{task.title}
				</p>

				{task.description && (
					<p className="ph-mask truncate text-label text-muted-foreground">
						{task.description}
					</p>
				)}

				{task.goal && <GoalProgress goal={task.goal} />}

				{(due || repeatText || task.labels.length > 0) && (
					<p className="flex flex-wrap items-center gap-x-2 text-caption">
						{(due || repeatText) && (
							<span
								className={cn(
									'flex items-center gap-1',
									due ? DUE_TONE_CLASSES[due.tone] : 'text-muted-foreground'
								)}
							>
								{due && (
									<>
										<Calendar aria-hidden className="size-3" />

										{due.text}
									</>
								)}

								{repeatText && (
									<>
										<RepeatIcon className="size-3" />

										<span className="sr-only">Repeats: {repeatText}</span>
									</>
								)}
							</span>
						)}

						{task.labels.map(label => (
							<span
								className={cn(
									'flex items-center gap-0.5',
									LABEL_COLOR_CLASSES[label.color ?? 'charcoal']
								)}
								key={label.id}
							>
								<Tag aria-hidden className="size-3" />
								<span className="ph-mask">{label.name}</span>
							</span>
						))}
					</p>
				)}
			</div>

			{task.goal && (
				<LogProgressControls task={task} titleId={titleId} today={today} />
			)}

			<TaskRowMenu
				autoFocus={shouldFocusMenu}
				className={ROW_CONTROL_CLASS}
				onEdit={openComposer}
				task={task}
				today={today}
			/>
		</li>
	)
}
