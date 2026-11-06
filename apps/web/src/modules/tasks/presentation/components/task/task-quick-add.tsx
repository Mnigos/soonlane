import {
	DEFAULT_TASK_PRIORITY,
	type CalendarDate,
	type TaskPriority,
} from '@soonlist/domain'
import { cn } from '@soonlist/ui/cn'
import { Button } from '@soonlist/ui/components/button'
import { type KeyboardEvent, type SubmitEvent, useState } from 'react'
import { useCreateTaskMutation } from '../../hooks/use-create-task-mutation'
import { PriorityPicker } from './priority-picker'

interface TaskQuickAddProps {
	defaultDueDate: CalendarDate
	onCancel: () => void
	onCreated?: () => void
	className?: string
}

const FIELD_CLASS =
	'rounded-md border bg-transparent px-2 py-1 text-label text-foreground outline-none focus-visible:border-primary'

function focusOnMount(input: HTMLInputElement | null) {
	input?.focus()
}

/** Todoist-style quick add: Enter submits, Escape cancels; the form stays open for the next task. */
export function TaskQuickAdd({
	defaultDueDate,
	onCancel,
	onCreated,
	className,
}: Readonly<TaskQuickAddProps>) {
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [dueDate, setDueDate] = useState<string>(defaultDueDate)
	const [dueTime, setDueTime] = useState('')
	const [priority, setPriority] = useState<TaskPriority>(DEFAULT_TASK_PRIORITY)
	const { mutate, isPending, isError } = useCreateTaskMutation()
	const canSubmit = title.trim() !== '' && dueDate !== '' && !isPending

	function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!canSubmit) return

		mutate(
			{
				title,
				description: description.trim() || undefined,
				dueDate,
				dueTime: dueTime || undefined,
				priority,
			},
			{
				onSuccess: () => {
					setTitle('')
					setDescription('')
					setDueTime('')
					setPriority(DEFAULT_TASK_PRIORITY)
					onCreated?.()
				},
			}
		)
	}

	function cancelOnEscape(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== 'Escape') return

		event.preventDefault()
		onCancel()
	}

	return (
		<form
			aria-label="Add task"
			className={cn(
				'my-2 flex flex-col gap-2 rounded-md border p-3',
				className
			)}
			onSubmit={submit}
		>
			<input
				aria-label="Task name"
				onKeyDown={cancelOnEscape}
				className="bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-faint-foreground"
				maxLength={500}
				onChange={event => setTitle(event.target.value)}
				placeholder="Task name"
				ref={focusOnMount}
				value={title}
			/>

			<input
				aria-label="Description"
				onKeyDown={cancelOnEscape}
				className="bg-transparent text-label text-foreground outline-none placeholder:text-faint-foreground"
				onChange={event => setDescription(event.target.value)}
				placeholder="Description"
				value={description}
			/>

			<div className="flex flex-wrap items-center gap-2">
				<input
					aria-label="Due date"
					onKeyDown={cancelOnEscape}
					className={FIELD_CLASS}
					onChange={event => setDueDate(event.target.value)}
					required
					type="date"
					value={dueDate}
				/>

				<input
					aria-label="Due time"
					onKeyDown={cancelOnEscape}
					className={FIELD_CLASS}
					onChange={event => setDueTime(event.target.value)}
					type="time"
					value={dueTime}
				/>

				<PriorityPicker
					onChange={setPriority}
					onKeyDown={cancelOnEscape}
					value={priority}
				/>
			</div>

			{isError && (
				<p className="text-caption text-danger" role="alert">
					Could not add the task. Try again.
				</p>
			)}

			<div className="flex justify-end gap-2 border-t pt-2">
				<Button onClick={onCancel} size="sm" variant="ghost">
					Cancel
				</Button>

				<Button disabled={!canSubmit} size="sm" type="submit">
					{isPending ? 'Adding…' : 'Add task'}
				</Button>
			</div>
		</form>
	)
}
