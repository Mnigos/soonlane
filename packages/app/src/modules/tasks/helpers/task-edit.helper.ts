import type {
	GoalInput,
	Label,
	Project,
	RepeatInput,
	Task,
} from '@soonlane/contracts'
import {
	type CalendarDate,
	type TaskPriority,
	getDueDateShortcuts,
	getEditedDueDate,
} from '@soonlane/domain'

/** The value an edit sends for a field: undefined while it matches the task's, so the save keeps it. */
export function getChanged<T>(value: T, previous: T) {
	return value === previous ? undefined : value
}

/** {@link getChanged} for an optional field: null when the edit removes it. */
export function getChangedOptional<T>(
	value: T | undefined,
	previous: T | undefined
) {
	return value === previous ? undefined : (value ?? null)
}

interface DueDateChange {
	dueDate: CalendarDate | undefined
}

interface PriorityChange {
	priority: TaskPriority
}

/** What an edit card holds when saved, with the due date it shows. */
export interface TaskDraft {
	title: string
	description: string
	dueDate: CalendarDate | undefined
	dueTime: string | undefined
	durationMinutes: number | undefined
	priority: TaskPriority
	repeat: RepeatInput | undefined
	labels: Label[]
	goal: GoalInput | undefined
	project: Project | undefined
}

/** The label ids an edit sends: undefined while they match the task's, so the save keeps them. */
export function getChangedLabelIds(task: Task, picked: Label[]) {
	const ids = picked.map(({ id }) => id)
	const isChanged =
		ids.length !== task.labels.length ||
		task.labels.some(({ id }) => !ids.includes(id))

	return isChanged ? ids : undefined
}

/** The project id an edit sends: undefined while it matches the task's, so the save keeps it; null removes it. */
export function getChangedProjectId(task: Task, project: Project | undefined) {
	return getChanged(project?.id ?? null, task.project?.id ?? null)
}

/** The goal an edit sends: undefined while it matches the task's, so the save keeps it; null removes it. */
export function getChangedGoal(task: Task, goal: GoalInput | undefined) {
	if (goal?.target === task.goal?.target && goal?.unit === task.goal?.unit)
		return undefined

	return goal ?? null
}

/** The `tasks.edit` fields of an edit card's save: only those that differ from the task, undefined when none do. */
export function getTaskEdit(task: Task, draft: TaskDraft) {
	const dueTime = getChangedOptional(draft.dueTime, task.dueTime)
	const repeat = isRepeatChanged(task, draft.repeat)
		? (draft.repeat ?? null)
		: undefined
	// A time or rule needs its date in the same edit.
	const isDateSent =
		draft.dueDate !== task.dueDate || Boolean(dueTime) || Boolean(repeat)
	const edit = {
		title: getChanged(draft.title.trim(), task.title),
		description: getChanged(
			draft.description.trim() || null,
			task.description ?? null
		),
		dueDate: isDateSent ? (draft.dueDate ?? null) : undefined,
		dueTime,
		durationMinutes: getChangedOptional(
			draft.durationMinutes,
			task.durationMinutes
		),
		priority: getChanged(draft.priority, task.priority),
		repeat,
		labelIds: getChangedLabelIds(task, draft.labels),
		goal: getChangedGoal(task, draft.goal),
		projectId: getChangedProjectId(task, draft.project),
	}

	return Object.values(edit).some(value => value !== undefined)
		? edit
		: undefined
}

/** The rule an edit sends to keep the task's own, "every!" included. */
export function toRepeatInput(task: Task | undefined): RepeatInput | undefined {
	return (
		task?.repeat && {
			unit: task.repeat.unit,
			interval: task.repeat.interval,
			fromCompletion: task.repeat.fromCompletion,
		}
	)
}

/** Whether the edit's rule differs from the task's in unit, interval or "every!". */
export function isRepeatChanged(task: Task, repeat: RepeatInput | undefined) {
	return (
		repeat?.unit !== task.repeat?.unit ||
		repeat?.interval !== task.repeat?.interval ||
		(repeat?.fromCompletion ?? false) !== (task.repeat?.fromCompletion ?? false)
	)
}

/**
 * The due date a composer saves for the typed or picked date. A typed rule without a date of its own starts today, as
 * in Todoist, since a repeating task needs a due date; every weekday moves a weekend pick to Monday, as the server does,
 * so the chip shows the real date.
 */
export function getScheduledDate(
	task: Task | undefined,
	pickedDate: CalendarDate | undefined,
	repeat: RepeatInput | undefined,
	today: CalendarDate
) {
	const date = pickedDate ?? (repeat && today)

	return date && getEditedDueDate(task, date, repeat?.unit)
}

/** The quick dates of a task's "…" menu: the date picker's, without Next weekend. */
export function getMenuDateShortcuts(today: CalendarDate) {
	return getDueDateShortcuts(today).filter(({ id }) => id !== 'next-weekend')
}

/** What choosing No date also removes, shown next to the option; undefined when the task has neither. */
export function getNoDateHint(dueTime: string | undefined, hasRepeat: boolean) {
	if (dueTime && hasRepeat) return 'Removes time and repeat'
	if (dueTime) return 'Removes time'
	if (hasRepeat) return 'Removes repeat'

	return undefined
}

/**
 * The `tasks.edit` input of a task's "…" menu: only the due date (null for No date, which also drops the time and the rule)
 * or the priority, so a change made elsewhere stays. Undefined when the choice is what the task already has.
 */
export function getMenuEdit(
	task: Task,
	today: CalendarDate,
	change: DueDateChange | PriorityChange
) {
	if ('priority' in change)
		return change.priority === task.priority
			? undefined
			: { id: task.id, today, priority: change.priority }

	const { dueDate } = change
	const isSame =
		dueDate === undefined
			? task.dueDate === undefined
			: getEditedDueDate(task, dueDate, task.repeat?.unit) === task.dueDate

	return isSame ? undefined : { id: task.id, today, dueDate: dueDate ?? null }
}
