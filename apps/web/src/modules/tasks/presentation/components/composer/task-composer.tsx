import type { Task } from '@soonlane/contracts'
import {
	DEFAULT_TASK_PRIORITY,
	type CalendarDate,
	type TaskPriority,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { AlarmClock, ArrowUp, Check, Plus, Tag, X } from 'lucide-react'
import {
	type KeyboardEvent,
	type SubmitEvent,
	useCallback,
	useRef,
	useState,
} from 'react'
import {
	CHIP_ICON_STROKE,
	COMPOSER_CHIP_CLASS,
} from '../../helpers/composer-chip.constants'
import { useCreateTaskMutation } from '../../hooks/use-create-task-mutation'
import { useUpdateTask } from '../../hooks/use-update-task'
import { ComingSoonButton } from './coming-soon-button'
import { DueDateChip } from './due-date-chip'
import { PriorityChip } from './priority-chip'

interface TaskComposerProps {
	defaultDueDate: CalendarDate
	today: CalendarDate
	onCancel: () => void
	onCreated?: () => void
	/** Edits this task in place instead of adding a new one. */
	task?: Task
	onSaved?: () => void
	/** Off in a dialog, which focuses the title itself and remembers its opener. */
	autoFocus?: boolean
	className?: string
}

const FIELD_CLASS =
	'bg-transparent text-foreground outline-none placeholder:text-faint-foreground'

/**
 * Todoist's task card: title, description and a row of chips. Enter submits,
 * Escape cancels. Adding keeps the card open for the next task; saving an
 * edit closes it.
 */
export function TaskComposer({
	defaultDueDate,
	today,
	onCancel,
	onCreated,
	task,
	onSaved,
	autoFocus = true,
	className,
}: Readonly<TaskComposerProps>) {
	const [title, setTitle] = useState(task?.title ?? '')
	const [description, setDescription] = useState(task?.description ?? '')
	const [dueDate, setDueDate] = useState(defaultDueDate)
	const [dueTime, setDueTime] = useState(task?.dueTime)
	const [priority, setPriority] = useState<TaskPriority>(
		task?.priority ?? DEFAULT_TASK_PRIORITY
	)
	const titleRef = useRef<HTMLInputElement>(null)
	// Stable, so a re-render (a picked priority) does not pull focus back to the title.
	const attachTitle = useCallback(
		(input: HTMLInputElement | null) => {
			titleRef.current = input
			if (autoFocus) input?.focus()
		},
		[autoFocus]
	)
	// isPending lags a render, so a quick second Enter would send the task twice.
	const isSubmittingRef = useRef(false)
	const { mutate, isPending, isError } = useCreateTaskMutation()
	const { updateTask } = useUpdateTask()
	const canSubmit = title.trim() !== '' && !isPending

	function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		// The send button stays red like Todoist's; with no title it points back to the field.
		if (title.trim() === '') titleRef.current?.focus()
		if (!canSubmit || isSubmittingRef.current) return

		if (task) {
			const edited = {
				id: task.id,
				title: title.trim(),
				description: description.trim() || undefined,
				dueDate,
				dueTime,
				priority,
			}
			const isChanged = (
				['title', 'description', 'dueDate', 'dueTime', 'priority'] as const
			).some(field => edited[field] !== task[field])

			if (isChanged) updateTask(edited)
			onSaved?.()
			return
		}

		isSubmittingRef.current = true
		mutate(
			{
				title,
				description: description.trim() || undefined,
				dueDate,
				dueTime,
				priority,
			},
			{
				onSuccess: () => {
					setTitle('')
					setDescription('')
					setDueTime(undefined)
					setPriority(DEFAULT_TASK_PRIORITY)
					titleRef.current?.focus()
					onCreated?.()
				},
				onSettled: () => {
					isSubmittingRef.current = false
				},
			}
		)
	}

	function cancelOnEscape(event: KeyboardEvent<HTMLElement>) {
		if (event.key !== 'Escape') return

		event.preventDefault()
		onCancel()
	}

	return (
		<form
			aria-label={task ? 'Edit task' : 'Add task'}
			className={cn(
				'my-2 flex flex-col rounded-xl border bg-card p-3 transition-colors focus-within:border-border-strong',
				className
			)}
			onSubmit={submit}
		>
			<input
				aria-label="Task name"
				className={cn(FIELD_CLASS, 'text-base leading-6')}
				maxLength={500}
				onChange={event => setTitle(event.target.value)}
				onKeyDown={cancelOnEscape}
				placeholder="Task name"
				ref={attachTitle}
				value={title}
			/>

			<input
				aria-label="Description"
				className={cn(FIELD_CLASS, 'text-label leading-5')}
				onChange={event => setDescription(event.target.value)}
				onKeyDown={cancelOnEscape}
				placeholder="Description"
				value={description}
			/>

			<div className="mt-1.75 flex flex-wrap items-center gap-1">
				<ComingSoonButton
					className="inline-flex size-7 items-center justify-center rounded-md bg-control"
					label="More actions"
					onKeyDown={cancelOnEscape}
				>
					<Plus aria-hidden className="size-5" strokeWidth={1.25} />
				</ComingSoonButton>

				<DueDateChip
					dueDate={dueDate}
					dueTime={dueTime}
					onDateChange={setDueDate}
					onKeyDown={cancelOnEscape}
					onTimeChange={setDueTime}
					today={today}
				/>

				<PriorityChip
					onChange={setPriority}
					onKeyDown={cancelOnEscape}
					value={priority}
				/>

				<ComingSoonButton
					className={COMPOSER_CHIP_CLASS}
					label="Reminders"
					onKeyDown={cancelOnEscape}
				>
					<AlarmClock aria-hidden strokeWidth={CHIP_ICON_STROKE} />
					Reminders
				</ComingSoonButton>

				<ComingSoonButton
					className={COMPOSER_CHIP_CLASS}
					label="Labels"
					onKeyDown={cancelOnEscape}
				>
					<Tag aria-hidden strokeWidth={CHIP_ICON_STROKE} />
					Labels
				</ComingSoonButton>

				<div className="ml-auto flex items-center gap-2">
					<button
						aria-label="Cancel"
						className="flex size-8 cursor-pointer items-center justify-center rounded-md text-secondary-foreground transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-primary"
						onClick={onCancel}
						onKeyDown={cancelOnEscape}
						type="button"
					>
						<X aria-hidden className="size-7" strokeWidth={0.9} />
					</button>

					<button
						aria-disabled={!canSubmit}
						aria-label={task ? 'Save task' : 'Add task'}
						className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						onKeyDown={cancelOnEscape}
						type="submit"
					>
						{task ? (
							<Check aria-hidden className="size-5" strokeWidth={2.25} />
						) : (
							<ArrowUp aria-hidden className="size-5" strokeWidth={2.25} />
						)}
					</button>
				</div>
			</div>

			{isError && (
				<p className="pt-2 text-caption text-danger" role="alert">
					Could not add the task. Try again.
				</p>
			)}
		</form>
	)
}
