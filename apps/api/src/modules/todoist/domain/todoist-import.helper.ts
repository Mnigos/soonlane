import type { TodoistPreview } from '@soonlane/contracts'
import {
	type CalendarDate,
	DEFAULT_TASK_PRIORITY,
	getToday,
	LABEL_COLORS,
	LABEL_NAME_MAX_LENGTH,
	type LabelColor,
	PROJECT_NAME_MAX_LENGTH,
	storedCalendarDateSchema,
	TASK_DESCRIPTION_MAX_LENGTH,
	TASK_TITLE_MAX_LENGTH,
	type TaskPriority,
	type TodoistImportChange,
} from '@soonlane/domain'
import type { TodoistItem, TodoistSnapshot } from './todoist-snapshot.schemas'

/** A due date as Todoist keeps it; `utc` marks a time pinned to a zone, which the import moves into the browser's zone. */
export interface DraftDue {
	date: CalendarDate
	time?: string
	utc: boolean
}

/** One task the import creates; `changed` when it arrives differently from Todoist. */
export interface TaskDraft {
	todoistId: string
	title: string
	description?: string
	due: DraftDue
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

function readDue(item: TodoistItem): DraftDue | undefined {
	const match = item.due ? DUE_PATTERN.exec(item.due.date) : null
	const date = storedCalendarDateSchema.safeParse(match?.[1])

	if (!date.success) return undefined

	return { date: date.data, time: match?.[2], utc: match?.[3] === 'Z' }
}

/** The due date and time a task gets: a UTC time moves into `timeZone`, a date or a floating time stays as written. */
export function toTaskDue({ date, time, utc }: DraftDue, timeZone: string) {
	if (!(utc && time)) return { dueDate: date, dueTime: time }

	const instant = new Date(`${date}T${time}Z`)

	return {
		dueDate: getToday(instant, timeZone),
		dueTime: new Intl.DateTimeFormat('en-GB', {
			timeZone,
			hour: '2-digit',
			minute: '2-digit',
			hourCycle: 'h23',
		}).format(instant),
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
	repeating: item => item.due?.is_recurring === true,
	subtasks: item => Boolean(item.parent_id),
	deadlines: item => Boolean(item.deadline),
	durations: item => Boolean(item.duration),
	longTitles: item => isTooLong(item.content, TASK_TITLE_MAX_LENGTH),
	longDescriptions: item =>
		isTooLong(item.description ?? '', TASK_DESCRIPTION_MAX_LENGTH),
} satisfies Partial<Record<TodoistImportChange, (item: TodoistItem) => boolean>>

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

/** Projects and sections count only when they hold an imported task; labels are the Todoist labels plus every name on an imported task (shared labels have no label object). Open tasks imported before are left out. */
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
	const freshItems = openItems.filter(item => !imported.has(item.id))
	const dated = freshItems.flatMap(item => {
		const due = readDue(item)

		return due ? [{ item, due }] : []
	})
	const items = dated.map(({ item }) => item)
	const inboxId = snapshot.user.inbox_project_id
	const projectsById = new Map(
		snapshot.projects
			.filter(project => !project.is_deleted && project.id !== inboxId)
			.map(project => [project.id, project])
	)
	const projects = [...new Set(items.map(item => item.project_id))].flatMap(
		id => projectsById.get(id) ?? []
	)
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
	const count = (isChanged: (item: TodoistItem) => boolean) =>
		items.filter(isChanged).length

	return {
		tasks: dated.map(({ item, due }) => ({
			todoistId: item.id,
			title: cut(item.content, TASK_TITLE_MAX_LENGTH),
			description:
				cut(item.description ?? '', TASK_DESCRIPTION_MAX_LENGTH) || undefined,
			due,
			priority: PRIORITY_FROM_TODOIST[item.priority] ?? DEFAULT_TASK_PRIORITY,
			labelNames: toNames(item.labels, LABEL_NAME_MAX_LENGTH),
			projectName:
				cut(
					projectsById.get(item.project_id)?.name ?? '',
					PROJECT_NAME_MAX_LENGTH
				) || undefined,
			changed:
				Boolean(item.section_id) ||
				Object.values(TASK_CHANGES).some(isChanged => isChanged(item)),
		})),
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
				noDate: freshItems.length - items.length,
				alreadyImported: openItems.length - freshItems.length,
				subtasks: count(TASK_CHANGES.subtasks),
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
