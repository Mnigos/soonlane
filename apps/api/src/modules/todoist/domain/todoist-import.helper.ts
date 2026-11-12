import type { TodoistPreview } from '@soonlane/contracts'
import {
	DEFAULT_TASK_PRIORITY,
	LABEL_NAME_MAX_LENGTH,
	PROJECT_NAME_MAX_LENGTH,
	TASK_DESCRIPTION_MAX_LENGTH,
	TASK_TITLE_MAX_LENGTH,
	type TaskPriority,
} from '@soonlane/domain'
import type { TodoistItem, TodoistSnapshot } from './todoist-snapshot.schemas'

/** A due date as Todoist keeps it; `utc` marks a time pinned to a zone, which the import moves into the browser's zone. */
export interface DraftDue {
	date: string
	time?: string
	utc: boolean
}

/** One task the import would create; the next step inserts these. */
export interface TaskDraft {
	title: string
	description?: string
	due: DraftDue
	priority: TaskPriority
	labelNames: string[]
	projectName?: string
}

export interface TodoistImportPlan {
	tasks: TaskDraft[]
	newLabelNames: string[]
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

	if (!match?.[1]) return undefined

	return { date: match[1], time: match[2], utc: match[3] === 'Z' }
}

function cut(text: string, maxLength: number) {
	return text.trim().slice(0, maxLength)
}

function isTooLong(text: string, maxLength: number) {
	return text.trim().length > maxLength
}

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

/**
 * Maps one Todoist snapshot onto the tasks and labels an import would create,
 * and counts what changes on the way. Only open tasks count; the Inbox is not
 * a project. Projects and sections count only when they hold an imported task.
 * Labels are the owner's Todoist labels plus every name on an imported task
 * (shared labels have no label object), matched to `existingLabelNames`
 * ignoring case.
 */
export function planTodoistImport(
	snapshot: TodoistSnapshot,
	existingLabelNames: readonly string[],
	existingProjectNames: readonly string[]
): TodoistImportPlan {
	const openItems = snapshot.items.filter(
		item => !(item.checked || item.is_deleted)
	)
	const dated = openItems.flatMap(item => {
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
	const labelSources = [
		...snapshot.labels
			.filter(label => !label.is_deleted)
			.map(({ name }) => name),
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
		})),
		newLabelNames,
		newProjectNames,
		preview: {
			tasks: items.length,
			newLabels: newLabelNames.length,
			existingLabels,
			newProjects: newProjectNames.length,
			existingProjects,
			changes: {
				repeating: count(item => item.due?.is_recurring === true),
				noDate: openItems.length - items.length,
				subtasks: count(item => Boolean(item.parent_id)),
				sections: countDistinct(items.map(item => item.section_id)),
				deadlines: count(item => Boolean(item.deadline)),
				durations: count(item => Boolean(item.duration)),
				longTitles: count(item =>
					isTooLong(item.content, TASK_TITLE_MAX_LENGTH)
				),
				longDescriptions: count(item =>
					isTooLong(item.description ?? '', TASK_DESCRIPTION_MAX_LENGTH)
				),
				longLabelNames: countTooLong(labelSources, LABEL_NAME_MAX_LENGTH),
				nestedProjects: projects.filter(project => Boolean(project.parent_id))
					.length,
				longProjectNames: countTooLong(projectSources, PROJECT_NAME_MAX_LENGTH),
			},
		},
	}
}
