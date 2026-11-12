import type { TodoistImportSummary } from '@soonlane/contracts'
import {
	importedTodoistTask,
	label,
	project,
	task,
	taskLabel,
} from '@soonlane/db'
import { type CalendarDate, taskIdSchema, type UserId } from '@soonlane/domain'
import { eq } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'
import type { LabelDraft, TaskDraft } from '../domain/todoist-import.helper'

export interface ImportedTask extends Omit<TaskDraft, 'due'> {
	dueDate?: CalendarDate
	dueTime?: string
}

export interface TodoistImport {
	ownerId: UserId
	tasks: ImportedTask[]
	newLabels: LabelDraft[]
	newProjectNames: string[]
}

/** Keeps each insert under Postgres' 65,535 parameters and well inside the query timeout. */
const ROWS_PER_INSERT = 1000

function chunk<TRow>(rows: readonly TRow[]) {
	return Array.from(
		{ length: Math.ceil(rows.length / ROWS_PER_INSERT) },
		(_, index) =>
			rows.slice(index * ROWS_PER_INSERT, (index + 1) * ROWS_PER_INSERT)
	)
}

function toIdsByName<TId>(rows: readonly { id: TId; name: string }[]) {
	return new Map(rows.map(row => [row.name.toLowerCase(), row.id]))
}

export class ImportedTodoistTaskRepository extends Context.Service<
	ImportedTodoistTaskRepository,
	{
		/** The Todoist ids of every task the owner imported. */
		readonly list: (ownerId: UserId) => Effect.Effect<string[], DbError>
		/** Saves the tasks not imported before with their labels and projects, all or nothing. */
		readonly create: (
			todoistImport: TodoistImport
		) => Effect.Effect<TodoistImportSummary, DbError>
	}
>()('soonlane/ImportedTodoistTaskRepository') {}

export const ImportedTodoistTaskRepositoryLive = Layer.effect(
	ImportedTodoistTaskRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return ImportedTodoistTaskRepository.of({
			list: ownerId =>
				db.run('ImportedTodoistTaskRepository.list', async database => {
					const rows = await database
						.select({ todoistId: importedTodoistTask.todoistId })
						.from(importedTodoistTask)
						.where(eq(importedTodoistTask.ownerId, ownerId))

					return rows.map(row => row.todoistId)
				}),
			create: ({ ownerId, tasks, newLabels, newProjectNames }) =>
				db.run(
					'ImportedTodoistTaskRepository.create',
					async database =>
						await database.transaction(async transaction => {
							const recorded = new Set<string>()

							// A second import of the same tasks waits on these keys and records none, so it creates nothing.
							for (const rows of chunk(tasks)) {
								const inserted = await transaction
									.insert(importedTodoistTask)
									.values(rows.map(({ todoistId }) => ({ ownerId, todoistId })))
									.onConflictDoNothing()
									.returning({ todoistId: importedTodoistTask.todoistId })

								for (const { todoistId } of inserted) recorded.add(todoistId)
							}

							const created = tasks
								.filter(({ todoistId }) => recorded.has(todoistId))
								.map(draft => ({
									...draft,
									id: taskIdSchema.parse(crypto.randomUUID()),
								}))

							if (created.length === 0)
								return {
									tasks: 0,
									changedTasks: 0,
									newLabels: 0,
									newProjects: 0,
								}

							const insertedProjects =
								newProjectNames.length === 0
									? []
									: await transaction
											.insert(project)
											.values(newProjectNames.map(name => ({ ownerId, name })))
											.onConflictDoNothing()
											.returning({ id: project.id })
							const insertedLabels =
								newLabels.length === 0
									? []
									: await transaction
											.insert(label)
											.values(
												newLabels.map(({ name, color }) => ({
													ownerId,
													name,
													color: color ?? null,
												}))
											)
											.onConflictDoNothing()
											.returning({ id: label.id })
							const projectIds = toIdsByName(
								await transaction
									.select({ id: project.id, name: project.name })
									.from(project)
									.where(eq(project.ownerId, ownerId))
							)
							const labelIds = toIdsByName(
								await transaction
									.select({ id: label.id, name: label.name })
									.from(label)
									.where(eq(label.ownerId, ownerId))
							)

							for (const rows of chunk(created))
								await transaction.insert(task).values(
									rows.map(draft => ({
										id: draft.id,
										ownerId,
										title: draft.title,
										description: draft.description ?? null,
										dueDate: draft.dueDate ?? null,
										dueTime: draft.dueTime ?? null,
										priority: draft.priority,
										projectId: draft.projectName
											? (projectIds.get(draft.projectName.toLowerCase()) ??
												null)
											: null,
									}))
								)

							const taskLabels = created.flatMap(draft =>
								draft.labelNames.flatMap(name => {
									const labelId = labelIds.get(name.toLowerCase())

									return labelId ? [{ taskId: draft.id, labelId }] : []
								})
							)

							for (const rows of chunk(taskLabels))
								await transaction.insert(taskLabel).values(rows)

							return {
								tasks: created.length,
								changedTasks: created.filter(draft => draft.changed).length,
								newLabels: insertedLabels.length,
								newProjects: insertedProjects.length,
							}
						})
				),
		})
	})
)
