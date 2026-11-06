import {
	DEFAULT_TASK_PRIORITY,
	type CalendarDate,
	type TaskPriority,
} from '@soonlist/domain'
import { cn } from '@soonlist/ui/cn'
import { Button } from '@soonlist/ui/components/button'
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
	className,
}: Readonly<TaskComposerProps>) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [priority, setPriority] = useState<TaskPriority>(DEFAULT_TASK_PRIORITY)
	const titleRef = useRef<HTMLInputElement>(null)
	// Stable, so a re-render (a picked priority) does not pull focus back to the title.
	const attachTitle = useCallback((input: HTMLInputElement | null) => {
		titleRef.current = input
		input?.focus()
	}, [])
	const { mutate, isPending, isError } = useCreateTaskMutation()
	const canSubmit = title.trim() !== '' && !isPending

	function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!canSubmit) return

		mutate(
			{
				title,
				description: description.trim() || undefined,
				dueDate: defaultDueDate,
				priority,
			},
			{
				onSuccess: () => {
					setTitle('')
					setDescription('')
					setPriority(DEFAULT_TASK_PRIORITY)
					titleRef.current?.focus()
					onCreated?.()
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
				<DueDateChip dueDate={defaultDueDate} today={today} />

				<PriorityChip
					onChange={setPriority}
					onKeyDown={cancelOnEscape}
					value={priority}
				/>

				<div className="ml-auto flex items-center gap-1">
					<Button
						aria-label="Cancel"
						onClick={onCancel}
						size="icon"
						variant="ghost"
					>
						<X />
					</Button>

					<Button
						aria-label="Add task"
						disabled={!canSubmit}
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
