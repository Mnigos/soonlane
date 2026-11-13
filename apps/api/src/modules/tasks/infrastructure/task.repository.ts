import type {
	Label,
	LogProgressOutput,
	Project,
	Task,
	UpdateTaskOutput,
} from '@soonlane/contracts'
import { label, project, task, taskLabel } from '@soonlane/db'
import type { TaskId, UserId } from '@soonlane/domain'
import { and, between, eq, gte, inArray, isNull, lt, or } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { toLabel } from '@/modules/labels/infrastructure/label.mapper'
import { toProject } from '@/modules/projects/infrastructure/project.mapper'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'
import type { SubtaskRefusal, TaskNotFound } from '../domain/task.errors'
import {
	COMPLETED_ORDER,
	ownedTasks,
	SHOWN_IN_LISTS,
} from './owned-tasks.query'
import { createTask } from './task-create.query'
import { updateProgress } from './task-progress.query'
import { matchesEveryWord, SEARCH_ORDER } from './task-search.query'
import { advanceDueDate, setCompletion, updateSubtree } from './task-tree.query'
import { updateTask } from './task-update.query'
import type {
	CompletedTasksBefore,
	CompletedTasksBetween,
	DueDateAdvance,
	MatchingTasks,
	NewTask,
	OpenTasks,
	ProgressLog,
	TaskCompletion,
	TaskKey,
	TaskLabel,
	TaskProject,
	TaskReschedule,
	TaskUpdate,
} from './task.repository.types'

export class TaskRepository extends Context.Service<
	TaskRepository,
	{
		readonly listOpen: (filter: OpenTasks) => Effect.Effect<Task[], DbError>
		readonly listCompletedBetween: (
			params: CompletedTasksBetween
		) => Effect.Effect<Task[], DbError>
		readonly findLatestCompletedAt: (
			params: CompletedTasksBefore
		) => Effect.Effect<Date | undefined, DbError>
		readonly listMatching: (
			params: MatchingTasks
		) => Effect.Effect<Task[], DbError>
		readonly listSubtasks: (key: TaskKey) => Effect.Effect<Task[], DbError>
		readonly find: (key: TaskKey) => Effect.Effect<Task | undefined, DbError>
		readonly create: (
			task: NewTask
		) => Effect.Effect<Task | TaskNotFound | SubtaskRefusal, DbError>
		readonly update: (
			update: TaskUpdate
		) => Effect.Effect<UpdateTaskOutput | undefined, DbError>
		readonly delete: (
			key: TaskKey
		) => Effect.Effect<TaskId | undefined, DbError>
		readonly count: (ownerId: UserId) => Effect.Effect<number, DbError>
		readonly setCompletion: (
			completion: TaskCompletion
		) => Effect.Effect<Task | undefined, DbError>
		readonly advanceDueDate: (
			advance: DueDateAdvance
		) => Effect.Effect<Task | undefined, DbError>
		readonly rescheduleOpen: (
			reschedule: TaskReschedule
		) => Effect.Effect<Task[], DbError>
		readonly findLabel: (
			label: Omit<TaskLabel, 'id'>
		) => Effect.Effect<Label | undefined, DbError>
		readonly findProject: (
			project: TaskProject
		) => Effect.Effect<Project | undefined, DbError>
		readonly assignLabel: (
			taskLabel: TaskLabel
		) => Effect.Effect<Task | undefined, DbError>
		readonly unassignLabel: (
			taskLabel: TaskLabel
		) => Effect.Effect<Task | undefined, DbError>
		readonly logProgress: (
			log: ProgressLog
		) => Effect.Effect<LogProgressOutput | undefined, DbError>
	}
>()('soonlane/TaskRepository') {}

export const TaskRepositoryLive = Layer.effect(
	TaskRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return TaskRepository.of({
			listOpen: ({ ownerId, labelId, projectId, range }) =>
				db.run(
					'TaskRepository.listOpen',
					async database =>
						await ownedTasks(database, ownerId).list(
							and(
								isNull(task.completedAt),
								labelId &&
									inArray(
										task.id,
										database
											.select({ id: taskLabel.taskId })
											.from(taskLabel)
											.where(eq(taskLabel.labelId, labelId))
									),
								projectId && eq(task.projectId, projectId),
								SHOWN_IN_LISTS,
								range &&
									or(
										isNull(task.dueDate),
										lt(task.dueDate, range.before),
										between(task.dueDate, range.from, range.to)
									)
							)
						)
				),
			listCompletedBetween: ({ ownerId, from, to }) =>
				db.run(
					'TaskRepository.listCompletedBetween',
					async database =>
						await ownedTasks(database, ownerId).list(
							and(gte(task.completedAt, from), lt(task.completedAt, to)),
							COMPLETED_ORDER
						)
				),
			findLatestCompletedAt: ({ ownerId, before }) =>
				db.run(
					'TaskRepository.findLatestCompletedAt',
					async database =>
						await ownedTasks(database, ownerId).latestCompletedBefore(before)
				),
			listMatching: ({ ownerId, query, limit }) =>
				db.run(
					'TaskRepository.listMatching',
					async database =>
						await ownedTasks(database, ownerId).list(
							matchesEveryWord(query),
							SEARCH_ORDER,
							limit
						)
				),
			find: ({ ownerId, id }) =>
				db.run(
					'TaskRepository.find',
					async database => await ownedTasks(database, ownerId).find(id)
				),
			listSubtasks: ({ ownerId, id }) =>
				db.run(
					'TaskRepository.listSubtasks',
					async database =>
						await ownedTasks(database, ownerId).list(eq(task.parentId, id))
				),
			create: newTask =>
				db.run(
					'TaskRepository.create',
					async database => await createTask(database, newTask)
				),
			update: update =>
				db.run(
					'TaskRepository.update',
					async database =>
						await database.transaction(
							async transaction => await updateTask(transaction, update)
						)
				),
			delete: ({ ownerId, id }) =>
				db.run(
					'TaskRepository.delete',
					async database =>
						await database.transaction(async transaction => {
							const tasks = ownedTasks(transaction, ownerId)

							await tasks.lockPath(id)

							const [row] = await tasks
								.delete(eq(task.id, id))
								.returning({ id: task.id })

							return row?.id
						})
				),
			count: ownerId =>
				db.run(
					'TaskRepository.count',
					async database => await ownedTasks(database, ownerId).count()
				),
			setCompletion: completion =>
				db.run(
					'TaskRepository.setCompletion',
					async database => await setCompletion(database, completion)
				),
			advanceDueDate: advance =>
				db.run(
					'TaskRepository.advanceDueDate',
					async database => await advanceDueDate(database, advance)
				),
			rescheduleOpen: ({ ownerId, ids, dueDate }) =>
				db.run(
					'TaskRepository.rescheduleOpen',
					async database =>
						await database.transaction(async transaction => {
							const tasks = ownedTasks(transaction, ownerId)

							await tasks.lockPaths(ids)

							const rows = await tasks
								.update(
									{ dueDate },
									and(inArray(task.id, ids), isNull(task.completedAt))
								)
								.returning()

							return await tasks.withRelations(rows)
						})
				),
			findLabel: ({ ownerId, labelId }) =>
				db.run('TaskRepository.findLabel', async database => {
					const [row] = await database
						.select()
						.from(label)
						.where(and(eq(label.ownerId, ownerId), eq(label.id, labelId)))

					return row && toLabel(row)
				}),
			findProject: ({ ownerId, projectId }) =>
				db.run('TaskRepository.findProject', async database => {
					const [row] = await database
						.select()
						.from(project)
						.where(and(eq(project.ownerId, ownerId), eq(project.id, projectId)))

					return row && toProject(row)
				}),
			assignLabel: ({ ownerId, id, labelId }) =>
				db.run('TaskRepository.assignLabel', async database => {
					const tasks = ownedTasks(database, ownerId)

					await tasks.assignLabels(id, [labelId])

					return await tasks.find(id)
				}),
			unassignLabel: ({ ownerId, id, labelId }) =>
				db.run('TaskRepository.unassignLabel', async database => {
					const tasks = ownedTasks(database, ownerId)

					await tasks.unassignLabel(id, labelId)

					return await tasks.find(id)
				}),
			logProgress: log =>
				db.run(
					'TaskRepository.logProgress',
					async database =>
						await database.transaction(async transaction => {
							const tasks = ownedTasks(transaction, log.ownerId)

							await tasks.lockPath(log.id)

							const row = await updateProgress(transaction, log)

							if (!row) return undefined
							await updateSubtree(
								tasks,
								{ completedAt: row.previousCompletedAt },
								row,
								row.dueDate === row.previousDueDate
									? undefined
									: row.previousDueDate
							)

							const [logged] = await tasks.withRelations([row])
							const completed = row.completed
								? {
										dueDate: row.previousDueDate ?? undefined,
										progress: row.previousProgress,
									}
								: undefined

							return logged && { task: logged, logged: row.logged, completed }
						})
				),
		})
	})
)
