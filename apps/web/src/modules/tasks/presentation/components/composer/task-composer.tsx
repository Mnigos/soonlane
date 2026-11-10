import type {
	CreateTaskInput,
	Label,
	RepeatInput,
	Task,
} from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { ArrowUp, Check, Plus, X } from 'lucide-react'
import {
	type KeyboardEvent,
	type SubmitEvent,
	useCallback,
	useRef,
	useState,
} from 'react'
import type { ComposerSource } from '@/modules/analytics/domain/analytics-event.types'
import { usePickedLabels } from '@/modules/labels/presentation/hooks/use-picked-labels'
import {
	getEditedDueDate,
	getEditedRule,
} from '../../../domain/repeat-rule.helper'
import { useCreateTaskMutation } from '../../hooks/use-create-task-mutation'
import { useTypedPriority } from '../../hooks/use-typed-priority'
import { useUpdateTask } from '../../hooks/use-update-task'
import { TaskActionsMenu } from '../task/task-actions-menu'
import { ComingSoonButton } from './coming-soon-button'
import { DueDateChip } from './due-date-chip'
import { GoalChip } from './goal-chip'
import { LabelsChip } from './labels-chip'
import { PriorityChip } from './priority-chip'

interface TaskComposerProps {
	defaultDueDate: CalendarDate
	/** Picked again after each task, like the label of an open label view. */
	defaultLabels?: Label[]
	today: CalendarDate
	source: ComposerSource
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

function getSavedRule(
	task: Task | undefined,
	scheduledDate: CalendarDate,
	repeat: RepeatInput | undefined
) {
	return task
		? getEditedRule(task, scheduledDate, repeat)
		: repeat && { ...repeat, anchor: scheduledDate }
}

/**
 * Todoist's task card: title, description and a row of chips. Enter submits,
 * Escape cancels. Adding keeps the card open for the next task; saving an
 * edit closes it.
 */
export function TaskComposer({
	defaultDueDate,
	defaultLabels,
	today,
	source,
	onCancel,
	onCreated,
	task,
	onSaved,
	autoFocus = true,
	className,
}: Readonly<TaskComposerProps>) {
	const {
		title,
		savedTitle,
		priority,
		changeTitle,
		pickPriority,
		resetTitleAndPriority,
	} = useTypedPriority(task)
	const [description, setDescription] = useState(task?.description ?? '')
	const [dueDate, setDueDate] = useState(defaultDueDate)
	const [dueTime, setDueTime] = useState(task?.dueTime)
	const [repeat, setRepeat] = useState<RepeatInput | undefined>(
		task?.repeat && { unit: task.repeat.unit, interval: task.repeat.interval }
	)
	const { pickedLabels, setLabels, resetLabels } =
		usePickedLabels(defaultLabels)
	// Every weekday moves a weekend pick to Monday, as the server does, so the chip shows the real date.
	const scheduledDate = getEditedDueDate(task, dueDate, repeat?.unit)
	// The labels name the anchor the save keeps, e.g. the 31st of a monthly task now due Feb 28.
	const savedRule = getSavedRule(task, scheduledDate, repeat)
	const [goal, setGoal] = useState<CreateTaskInput['goal']>()
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
	const { mutate, isPending, isError } = useCreateTaskMutation(source, today)
	const { updateTask } = useUpdateTask()
	const canSubmit = savedTitle.trim() !== '' && !isPending

	function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		// The send button stays red like Todoist's; with no title it points back to the field.
		if (savedTitle.trim() === '') titleRef.current?.focus()
		if (!canSubmit || isSubmittingRef.current) return

		if (task) {
			const labelIds = pickedLabels.map(({ id }) => id)
			const isLabelChange =
				labelIds.length !== task.labels.length ||
				task.labels.some(({ id }) => !labelIds.includes(id))
			const edited = {
				id: task.id,
				title: savedTitle.trim(),
				description: description.trim() || undefined,
				dueDate: scheduledDate,
				dueTime,
				priority,
				repeat: repeat ?? null,
				labelIds: isLabelChange ? labelIds : undefined,
			}
			const isChanged =
				isLabelChange ||
				(
					['title', 'description', 'dueDate', 'dueTime', 'priority'] as const
				).some(field => edited[field] !== task[field]) ||
				repeat?.unit !== task.repeat?.unit ||
				repeat?.interval !== task.repeat?.interval

			if (isChanged) updateTask(edited)
			onSaved?.()
			return
		}

		isSubmittingRef.current = true
		mutate(
			{
				title: savedTitle,
				description: description.trim() || undefined,
				dueDate: scheduledDate,
				dueTime,
				priority,
				repeat,
				labelIds: pickedLabels.map(({ id }) => id),
				goal,
			},
			{
				onSuccess: () => {
					resetTitleAndPriority()
					setDescription('')
					setDueTime(undefined)
					setRepeat(undefined)
					resetLabels()
					setGoal(undefined)
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
				onChange={event => changeTitle(event.target.value)}
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
					dueDate={scheduledDate}
					dueTime={dueTime}
					onDateChange={setDueDate}
					onKeyDown={cancelOnEscape}
					onRepeatChange={rule => {
						// Keeps the date on the chip, which the old rule may have moved off the picked day.
						setDueDate(scheduledDate)
						setRepeat(rule)
					}}
					onTimeChange={setDueTime}
					repeat={savedRule}
					today={today}
				/>

				<PriorityChip
					onChange={pickPriority}
					onKeyDown={cancelOnEscape}
					value={priority}
				/>

				<GoalChip
					isReadOnly={Boolean(task)}
					onChange={setGoal}
					onKeyDown={cancelOnEscape}
					value={task?.goal ?? goal}
				/>

				<LabelsChip
					onChange={setLabels}
					onKeyDown={cancelOnEscape}
					value={pickedLabels}
				/>

				<div className="ml-auto flex items-center gap-2">
					<TaskActionsMenu
						onKeyDown={cancelOnEscape}
						task={task}
						today={today}
					/>

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
