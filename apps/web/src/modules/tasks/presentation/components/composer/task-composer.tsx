import {
	DEFAULT_TASK_PRIORITY,
	type CalendarDate,
	type TaskPriority,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Button } from '@soonlane/ui/components/button'
import { SendHorizontal, X } from 'lucide-react'
import {
	type KeyboardEvent,
	type SubmitEvent,
	useCallback,
	useRef,
	useState,
} from 'react'
import { useCreateTaskMutation } from '../../hooks/use-create-task-mutation'
import { DueDateChip } from './due-date-chip'
import { PriorityChip } from './priority-chip'

interface TaskComposerProps {
	defaultDueDate: CalendarDate
	today: CalendarDate
	onCancel: () => void
	onCreated?: () => void
	/** Off in a dialog, which focuses the title itself and remembers its opener. */
	autoFocus?: boolean
	className?: string
}

const FIELD_CLASS =
	'bg-transparent text-foreground outline-none placeholder:text-faint-foreground'

/**
 * Todoist's add-task card: title, description and a row of chips. Enter
 * submits, Escape cancels; the card stays open for the next task.
 */
export function TaskComposer({
	defaultDueDate,
	today,
	onCancel,
	onCreated,
	autoFocus = true,
	className,
}: Readonly<TaskComposerProps>) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [dueDate, setDueDate] = useState(defaultDueDate)
	const [dueTime, setDueTime] = useState<string>()
	const [priority, setPriority] = useState<TaskPriority>(DEFAULT_TASK_PRIORITY)
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
	const canSubmit = title.trim() !== '' && !isPending

	function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!canSubmit || isSubmittingRef.current) return

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
			aria-label="Add task"
			className={cn(
				'my-2 flex flex-col rounded-lg border border-faint-foreground/50',
				className
			)}
			onSubmit={submit}
		>
			<div className="flex flex-col gap-1 px-3 pt-3 pb-2">
				<input
					aria-label="Task name"
					className={cn(FIELD_CLASS, 'text-sm font-medium')}
					maxLength={500}
					onChange={event => setTitle(event.target.value)}
					onKeyDown={cancelOnEscape}
					placeholder="Task name"
					ref={attachTitle}
					value={title}
				/>

				<input
					aria-label="Description"
					className={cn(FIELD_CLASS, 'text-label')}
					onChange={event => setDescription(event.target.value)}
					onKeyDown={cancelOnEscape}
					placeholder="Description"
					value={description}
				/>
			</div>

			<div className="flex flex-wrap items-center gap-2 px-3 pb-3">
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

				<div className="ml-auto flex items-center gap-1">
					<Button
						aria-label="Cancel"
						onClick={onCancel}
						onKeyDown={cancelOnEscape}
						size="icon"
						variant="ghost"
					>
						<X />
					</Button>

					<Button
						aria-label="Add task"
						disabled={!canSubmit}
						onKeyDown={cancelOnEscape}
						size="icon"
						type="submit"
					>
						<SendHorizontal />
					</Button>
				</div>
			</div>

			{isError && (
				<p className="px-3 pb-3 text-caption text-danger" role="alert">
					Could not add the task. Try again.
				</p>
			)}
		</form>
	)
}
