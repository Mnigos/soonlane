import type { TodoistPreview } from '@soonlane/contracts'
import {
	type CalendarDate,
	DEFAULT_TASK_PRIORITY,
	findTypedRepeatRules,
	getFirstOccurrence,
	getToday,
	isDurationInRange,
	LABEL_COLORS,
	LABEL_NAME_MAX_LENGTH,
	type LabelColor,
	PROJECT_NAME_MAX_LENGTH,
	type RepeatRule,
	storedCalendarDateSchema,
	TASK_DESCRIPTION_MAX_LENGTH,
	TASK_TITLE_MAX_LENGTH,
	type TaskPriority,
	type TodoistImportChange,
} from '@soonlane/domain'
import type { TodoistItem, TodoistSnapshot } from './todoist-snapshot.schemas'
import { type ItemPlacement, placeTodoistItems } from './todoist-subtask.helper'

/** A due date as Todoist keeps it; `utc` marks a time pinned to a zone, which the import moves into the browser's zone. */
export interface DraftDue {
	date: CalendarDate
	time?: string
	utc: boolean
	repeat?: Omit<RepeatRule, 'anchor'>
}

/** One task the import creates, after its parent; `changed` when it arrives differently from Todoist. */
export interface TaskDraft {
	todoistId: string
	parentTodoistId?: string
	title: string
	description?: string
	due?: DraftDue
	durationMinutes?: number
	priority: TaskPriority
	labelNames: string[]
	projectName?: string
	changed: boolean
}

export interface LabelDraft {
	name: string
	color?: LabelColor
}

export interface TodoistImportPlan {
	tasks: TaskDraft[]
	newLabels: LabelDraft[]
	newProjectNames: string[]
	preview: TodoistPreview
}

/** Todoist's 4 is its most urgent (p1 in its UI), Soonlane's is 1. */
const PRIORITY_FROM_TODOIST: Readonly<Record<number, TaskPriority>> = {
	4: 1,
	3: 2,
	2: 3,
	1: 4,
}
const DUE_PATTERN =
	/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(Z)?)?$/u
/** Todoist appends the due time to the rule ("every day at 9am"); the import reads the time from the due date. */
const DUE_TIME_SUFFIX_PATTERN =
	/^(?:\s+at\s+(?:noon|midnight|\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?$/iu

/** The rule only when the whole English due string is one repeat phrase Soonlane can store. */
function readRepeat(due: NonNullable<TodoistItem['due']>, date: CalendarDate) {
	if (!(due.is_recurring && due.lang === 'en' && due.string)) return undefined

	const text = due.string.trim()
	const [phrase, ...others] = findTypedRepeatRules(text, [], date)

	return phrase?.start === 0 &&
		others.length === 0 &&
		DUE_TIME_SUFFIX_PATTERN.test(text.slice(phrase.end))
		? phrase.rule
		: undefined
}

function readDue({ due }: TodoistItem): DraftDue | undefined {
	const match = due ? DUE_PATTERN.exec(due.date) : null
	const date = storedCalendarDateSchema.safeParse(match?.[1])

	if (!(due && date.success)) return undefined

	return {
		date: date.data,
		time: match?.[2],
		utc: match?.[3] === 'Z',
		repeat: readRepeat(due, date.data),
	}
}

function toLocalDue(due: DraftDue, timeZone: string) {
	if (!(due.utc && due.time)) return { date: due.date, time: due.time }

	const instant = new Date(`${due.date}T${due.time}Z`)

	return {
		date: getToday(instant, timeZone),
		time: new Intl.DateTimeFormat('en-GB', {
			timeZone,
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
		}).format(instant),
	}
}

/** Todoist's minutes on a task with a due time; a length in days or out of range is dropped. */
function readDurationMinutes(item: TodoistItem) {
	const amount =
		item.duration?.unit === 'minute' ? item.duration.amount : undefined

	return amount !== undefined &&
		readDue(item)?.time !== undefined &&
		isDurationInRange(amount)
		? amount
		: undefined
}

/** The due date, time and repeat rule a task gets: none without a due, a UTC time moves into `timeZone`, and a kept rule starts as a new task's would. */
export function toTaskDue(due: DraftDue | undefined, timeZone: string) {
	if (!due) return {}

	const local = toLocalDue(due, timeZone)
	const dueDate = getFirstOccurrence(local.date, due.repeat?.unit)

	return {
		dueDate,
		dueTime: local.time,
		repeat: due.repeat && { ...due.repeat, anchor: dueDate },
	}
}

function cut(text: string, maxLength: number) {
	return text.trim().slice(0, maxLength)
}

function isTooLong(text: string, maxLength: number) {
	return text.trim().length > maxLength
}

/** The changes counted per imported task; any of them, or a section, makes the task arrive changed. */
const TASK_CHANGES = {
	repeating: item => item.due?.is_recurring === true && !readDue(item)?.repeat,
	subtasks: (item, { parent }) => Boolean(item.parent_id) && !parent,
	deepSubtasks: (item, { parent }) =>
		parent !== undefined && parent.item.id !== item.parent_id,
	deadlines: item => Boolean(item.deadline),
	durations: item =>
		Boolean(item.duration) && readDurationMinutes(item) === undefined,
	longTitles: item => isTooLong(item.content, TASK_TITLE_MAX_LENGTH),
	longDescriptions: item =>
		isTooLong(item.description ?? '', TASK_DESCRIPTION_MAX_LENGTH),
} satisfies Partial<
	Record<
		TodoistImportChange,
		(item: TodoistItem, placement: ItemPlacement) => boolean
	>
>

/** Label or project names as Soonlane would keep them: trimmed, cut to length and unique ignoring case, the first spelling winning. */
function toNames(names: readonly string[], maxLength: number) {
	const byKey = new Map<string, string>()

	for (const name of names) {
		const kept = cut(name, maxLength)

		if (kept && !byKey.has(kept.toLowerCase()))
			byKey.set(kept.toLowerCase(), kept)
	}

	return [...byKey.values()]
}

/** The kept names the owner does not have yet, matched ignoring case, and how many they already have. */
function matchNames(
	names: readonly string[],
	existingNames: readonly string[]
) {
	const existing = new Set(existingNames.map(name => name.toLowerCase()))
	const newNames = names.filter(name => !existing.has(name.toLowerCase()))

	return { newNames, existingCount: names.length - newNames.length }
}

function countTooLong(names: readonly string[], maxLength: number) {
	return new Set(
		names
			.filter(name => isTooLong(name, maxLength))
			.map(name => name.trim().toLowerCase())
	).size
}

function countDistinct(values: readonly (string | null | undefined)[]) {
	return new Set(values.filter(Boolean)).size
}

/** Todoist names its colors in snake case (`berry_red`), Soonlane in kebab case. */
function toLabelColor(todoistColor: string | null | undefined) {
	return LABEL_COLORS.find(
		color => color === todoistColor?.replaceAll('_', '-')
	)
}

/** A subtask takes its top-level task's project. Projects and sections count only when they hold an imported task; labels are the Todoist labels plus every name on an imported task (shared labels have no label object). Open tasks imported before are left out. */
export function planTodoistImport(
	snapshot: TodoistSnapshot,
	existingLabelNames: readonly string[],
	existingProjectNames: readonly string[],
	importedTodoistIds: readonly string[]
): TodoistImportPlan {
	const imported = new Set(importedTodoistIds)
	const openItems = snapshot.items.filter(
		item => !(item.checked || item.is_deleted)
	)
	const items = openItems.filter(item => !imported.has(item.id))
	const placements = placeTodoistItems(items)
	const inboxId = snapshot.user.inbox_project_id
	const projectsById = new Map(
		snapshot.projects
			.filter(project => !project.is_deleted && project.id !== inboxId)
			.map(project => [project.id, project])
	)
	const projects = [
		...new Set(placements.map(({ root }) => root.project_id)),
	].flatMap(id => projectsById.get(id) ?? [])
	const projectSources = projects.map(({ name }) => name)
	const { newNames: newProjectNames, existingCount: existingProjects } =
		matchNames(
			toNames(projectSources, PROJECT_NAME_MAX_LENGTH),
			existingProjectNames
		)
	const todoistLabels = snapshot.labels.filter(label => !label.is_deleted)
	const labelSources = [
		...todoistLabels.map(({ name }) => name),
		...items.flatMap(item => item.labels),
	]
	const { newNames: newLabelNames, existingCount: existingLabels } = matchNames(
		toNames(labelSources, LABEL_NAME_MAX_LENGTH),
		existingLabelNames
	)
	const count = (
		isChanged: (item: TodoistItem, placement: ItemPlacement) => boolean
	) =>
		placements.filter(placement => isChanged(placement.item, placement)).length

	return {
		tasks: placements.map(placement => {
			const { item, parent, root } = placement

			return {
				todoistId: item.id,
				parentTodoistId: parent?.item.id,
				title: cut(item.content, TASK_TITLE_MAX_LENGTH),
				description:
					cut(item.description ?? '', TASK_DESCRIPTION_MAX_LENGTH) || undefined,
				due: readDue(item),
				durationMinutes: readDurationMinutes(item),
				priority: PRIORITY_FROM_TODOIST[item.priority] ?? DEFAULT_TASK_PRIORITY,
				labelNames: toNames(item.labels, LABEL_NAME_MAX_LENGTH),
				projectName:
					cut(
						projectsById.get(root.project_id)?.name ?? '',
						PROJECT_NAME_MAX_LENGTH
					) || undefined,
				changed:
					Boolean(item.section_id) ||
					Object.values(TASK_CHANGES).some(isChanged =>
						isChanged(item, placement)
					),
			}
		}),
		newLabels: newLabelNames.map(name => ({
			name,
			color: toLabelColor(
				todoistLabels.find(
					label =>
						cut(label.name, LABEL_NAME_MAX_LENGTH).toLowerCase() ===
						name.toLowerCase()
				)?.color
			),
		})),
		newProjectNames,
		preview: {
			tasks: items.length,
			newLabels: newLabelNames.length,
			existingLabels,
			newProjects: newProjectNames.length,
			existingProjects,
			changes: {
				repeating: count(TASK_CHANGES.repeating),
				alreadyImported: openItems.length - items.length,
				subtasks: count(TASK_CHANGES.subtasks),
				deepSubtasks: count(TASK_CHANGES.deepSubtasks),
				sections: countDistinct(items.map(item => item.section_id)),
				deadlines: count(TASK_CHANGES.deadlines),
				durations: count(TASK_CHANGES.durations),
				longTitles: count(TASK_CHANGES.longTitles),
				longDescriptions: count(TASK_CHANGES.longDescriptions),
				longLabelNames: countTooLong(labelSources, LABEL_NAME_MAX_LENGTH),
				nestedProjects: projects.filter(project => Boolean(project.parent_id))
					.length,
				longProjectNames: countTooLong(projectSources, PROJECT_NAME_MAX_LENGTH),
			},
		},
	}
}
