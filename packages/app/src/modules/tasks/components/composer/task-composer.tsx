import type { ComposerSource } from '@soonlane/analytics'
import type {
	GoalInput,
	Label,
	Project,
	RepeatInput,
	Task,
} from '@soonlane/contracts'
import {
	type CalendarDate,
	getEditedDueDate,
	getEditedRule,
} from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { ArrowUp, Check, Plus, X } from 'lucide-react'
import { type KeyboardEvent, type SubmitEvent, useRef, useState } from 'react'
import { describeFailure } from '../../../shell/helpers/maintenance.helper'
import { isSaveShortcut } from '../../helpers/composer-key.helper'
import {
	getChangedGoal,
	getChangedLabelIds,
	isRepeatChanged,
} from '../../helpers/task-edit.helper'
import { useCreateTaskMutation } from '../../hooks/use-create-task-mutation'
import { useTypedTitle } from '../../hooks/use-typed-title'
import { useUpdateTask } from '../../hooks/use-update-task'
import { TaskActionsMenu } from '../task/task-actions-menu'
import { ComingSoonButton } from './coming-soon-button'
import { DueDateChip } from './due-date-chip'
import { GoalChip } from './goal-chip'
import { LabelsChip } from './labels-chip'
import { PriorityChip } from './priority-chip'
import { TitleField } from './title-field'

interface TaskComposerProps {
	defaultDueDate: CalendarDate | undefined
	/** Picked again after each task, like the label of an open label view. */
	defaultLabels?: Label[]
	/** Every task it adds goes into it, like the project of an open project view. */
	defaultProject?: Project
	today: CalendarDate
	source: ComposerSource
	onCancel: () => void
	onCreated?: () => void
	/** Edits this task in place instead of adding a new one. */
	task?: Task
	onSaved?: () => void
	/** Closes an edit card in a dialog, which the deleted task's row cannot unmount. */
	onDeleted?: () => void
	/** Off in a dialog, which focuses the title itself and remembers its opener. */
	autoFocus?: boolean
	onSuggestionsToggle?: (isOpen: boolean) => void
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
 * Todoist's task card: title, description and a row of chips. Enter submits
 * from the text fields, Cmd+Enter or Ctrl+Enter from anywhere in the card,
 * Escape cancels. Adding keeps the card open for the next task; saving an
 * edit closes it.
 */
export function TaskComposer({
	defaultDueDate,
	defaultLabels,
	defaultProject,
	today,
	source,
	onCancel,
	onCreated,
	task,
	onSaved,
	onDeleted,
	autoFocus = true,
	onSuggestionsToggle,
	className,
}: Readonly<TaskComposerProps>) {
	const {
		title,
		savedTitle,
		priority,
		repeat,
		typedDueDate,
		pickedLabels,
		highlights,
		dismissible,
		changeTitle,
		pickPriority,
		pickDueDate,
		pickRepeat,
		pickLabels,
		reset,
	} = useTypedTitle(task, today, defaultLabels)
	const [description, setDescription] = useState(task?.description ?? '')
	const [dueDate, setDueDate] = useState<CalendarDate | undefined>(
		defaultDueDate
	)
	const [dueTime, setDueTime] = useState(task?.dueTime)
	// Every weekday moves a weekend pick to Monday, as the server does, so the chip shows the real date.
	const pickedDate = typedDueDate ?? dueDate
	const scheduledDate =
		pickedDate && getEditedDueDate(task, pickedDate, repeat?.unit)
	// The labels name the anchor the save keeps, e.g. the 31st of a monthly task now due Feb 28.
	const savedRule = scheduledDate && getSavedRule(task, scheduledDate, repeat)
	const [goal, setGoal] = useState<GoalInput | undefined>(
		task?.goal && { target: task.goal.target, unit: task.goal.unit }
	)
	const titleRef = useRef<HTMLInputElement>(null)
	// isPending lags a render, so a quick second Enter would send the task twice.
	const isSubmittingRef = useRef(false)
	const { mutate, isPending, error } = useCreateTaskMutation(source, today)
	const { updateTask } = useUpdateTask(today)
	const canSubmit = savedTitle.trim() !== '' && !isPending

	function submit(event: SubmitEvent<HTMLFormElement>) {
		event.preventDefault()
		// The send button stays red like Todoist's; with no title it points back to the field.
		if (savedTitle.trim() === '') titleRef.current?.focus()
		if (!canSubmit || isSubmittingRef.current) return

		if (task) {
			const labelIds = getChangedLabelIds(task, pickedLabels)
			const changedGoal = getChangedGoal(task, goal)
			const edited = {
				id: task.id,
				title: savedTitle.trim(),
				description: description.trim() || undefined,
				dueDate: scheduledDate,
				dueTime,
				priority,
				repeat: repeat ?? null,
				labelIds,
				goal: changedGoal,
				today,
			}
			const isChanged =
				labelIds !== undefined ||
				changedGoal !== undefined ||
				(
					['title', 'description', 'dueDate', 'dueTime', 'priority'] as const
				).some(field => edited[field] !== task[field]) ||
				isRepeatChanged(task, repeat)

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
				projectId: defaultProject?.id,
				goal,
			},
			{
				onSuccess: () => {
					reset()
					setDescription('')
					setDueTime(undefined)
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

	/** Every field and chip has it; a popover's own fields do not, so their Enter keeps applying the popover. */
	function handleFieldKeys(event: KeyboardEvent<HTMLElement>) {
		if (isSaveShortcut(event) && !event.nativeEvent.isComposing) {
			event.preventDefault()
			event.currentTarget.closest('form')?.requestSubmit()
			return
		}
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
			<TitleField
				autoFocus={autoFocus}
				className={cn(FIELD_CLASS, 'text-base leading-6')}
				dismissible={dismissible}
				highlights={highlights}
				inputRef={titleRef}
				onChange={changeTitle}
				onKeyDown={handleFieldKeys}
				onSuggestionsToggle={onSuggestionsToggle}
				value={title}
			/>

			<input
				aria-label="Description"
				className={cn(FIELD_CLASS, 'text-label leading-5')}
				onChange={event => setDescription(event.target.value)}
				onKeyDown={handleFieldKeys}
				placeholder="Description"
				value={description}
			/>

			<div className="mt-1.75 flex flex-wrap items-center gap-1">
				<ComingSoonButton
					className="inline-flex size-7 items-center justify-center rounded-md bg-control"
					label="More actions"
					onKeyDown={handleFieldKeys}
				>
					<Plus aria-hidden className="size-5" strokeWidth={1.25} />
				</ComingSoonButton>

				<DueDateChip
					dueDate={scheduledDate}
					dueTime={dueTime}
					onDateChange={date => {
						setDueDate(date)
						pickDueDate()
					}}
					onKeyDown={handleFieldKeys}
					onNoDate={() => {
						setDueDate(undefined)
						pickDueDate()
						setDueTime(undefined)
						pickRepeat(undefined)
					}}
					onRepeatChange={rule => {
						// Keeps the date on the chip, which the old rule may have moved off the picked day.
						setDueDate(scheduledDate)
						pickRepeat(rule)
					}}
					onTimeChange={setDueTime}
					repeat={savedRule}
					today={today}
				/>

				<PriorityChip
					onChange={pickPriority}
					onKeyDown={handleFieldKeys}
					value={priority}
				/>

				<GoalChip onChange={setGoal} onKeyDown={handleFieldKeys} value={goal} />

				<LabelsChip
					onChange={pickLabels}
					onKeyDown={handleFieldKeys}
					value={pickedLabels}
				/>

				<div className="ml-auto flex items-center gap-2">
					<TaskActionsMenu
						onDeleted={onDeleted}
						onKeyDown={handleFieldKeys}
						task={task}
						today={today}
					/>

					<button
						aria-label="Cancel"
						className="flex size-8 cursor-pointer items-center justify-center rounded-md text-secondary-foreground transition-colors hover:bg-hover focus-visible:outline-2 focus-visible:outline-primary"
						onClick={onCancel}
						onKeyDown={handleFieldKeys}
						type="button"
					>
						<X aria-hidden className="size-7" strokeWidth={0.9} />
					</button>

					<button
						aria-disabled={!canSubmit}
						aria-label={task ? 'Save task' : 'Add task'}
						className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						onKeyDown={handleFieldKeys}
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

			{error && (
				<p className="pt-2 text-caption text-danger" role="alert">
					{describeFailure(error, 'Could not add the task. Try again.')}
				</p>
			)}
		</form>
	)
}
