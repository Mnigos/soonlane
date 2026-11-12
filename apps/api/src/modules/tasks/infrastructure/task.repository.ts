import type {
	GoalInput,
	Label,
	LogProgressOutput,
	Project,
	Task,
	UpdateTaskOutput,
} from '@soonlane/contracts'
import { label, project, task, taskLabel } from '@soonlane/db'
import {
	DEFAULT_TASK_PRIORITY,
	type TaskId,
	type UserId,
} from '@soonlane/domain'
import {
	and,
	between,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	lt,
	sql,
} from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { toLabel } from '@/modules/labels/infrastructure/label.mapper'
import { toProject } from '@/modules/projects/infrastructure/project.mapper'
import type { DbError } from '@/platform/db/db.errors'
import { Db } from '@/platform/db/db.layer'
import { ownedTasks } from './owned-tasks.query'
import { updateProgress } from './task-progress.query'
import { updateTask } from './task-update.query'
import { toTask } from './task.mapper'
import type {
	CompletedTasksBetween,
	DueDateAdvance,
	NewTask,
	OpenTasksBefore,
	OpenTasksBetween,
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
		readonly listOpen: (ownerId: UserId) => Effect.Effect<Task[], DbError>
		readonly listOpenBetween: (
			params: OpenTasksBetween
		) => Effect.Effect<Task[], DbError>
		readonly listOpenBefore: (
			params: OpenTasksBefore
		) => Effect.Effect<Task[], DbError>
		readonly listOpenWithLabel: (
			label: Omit<TaskLabel, 'id'>
		) => Effect.Effect<Task[], DbError>
		readonly listOpenInProject: (
			project: TaskProject
		) => Effect.Effect<Task[], DbError>
		readonly listCompletedBetween: (
			params: CompletedTasksBetween
		) => Effect.Effect<Task[], DbError>
		readonly find: (key: TaskKey) => Effect.Effect<Task | undefined, DbError>
		readonly create: (task: NewTask) => Effect.Effect<Task, DbError>
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

/** Clamped to the restored goal's target, or to the stored one; a task without a goal keeps 0, which its check requires. */
function getRestoredProgress(
	progress: number | undefined,
	goal: GoalInput | undefined
) {
	if (goal && progress !== undefined) return Math.min(progress, goal.target)
	if (goal) return sql`least(${task.goalProgress}, ${goal.target})`
	if (progress === undefined) return undefined

	return sql`least(${progress}, coalesce(${task.goalTarget}, 0))`
}

export const TaskRepositoryLive = Layer.effect(
	TaskRepository,
	Effect.gen(function* () {
		const db = yield* Db

		return TaskRepository.of({
			listOpen: ownerId =>
				db.run(
					'TaskRepository.listOpen',
					async database =>
						await ownedTasks(database, ownerId).list(isNull(task.completedAt))
				),
			listOpenBetween: ({ ownerId, from, to }) =>
				db.run(
					'TaskRepository.listOpenBetween',
					async database =>
						await ownedTasks(database, ownerId).list(
							and(isNull(task.completedAt), between(task.dueDate, from, to))
						)
				),
			listOpenBefore: ({ ownerId, before }) =>
				db.run(
					'TaskRepository.listOpenBefore',
					async database =>
						await ownedTasks(database, ownerId).list(
							and(isNull(task.completedAt), lt(task.dueDate, before))
						)
				),
			listOpenWithLabel: ({ ownerId, labelId }) =>
				db.run(
					'TaskRepository.listOpenWithLabel',
					async database =>
						await ownedTasks(database, ownerId).list(
							and(
								isNull(task.completedAt),
								inArray(
									task.id,
									database
										.select({ id: taskLabel.taskId })
										.from(taskLabel)
										.where(eq(taskLabel.labelId, labelId))
								)
							)
						)
				),
			listOpenInProject: ({ ownerId, projectId }) =>
				db.run(
					'TaskRepository.listOpenInProject',
					async database =>
						await ownedTasks(database, ownerId).list(
							and(isNull(task.completedAt), eq(task.projectId, projectId))
						)
				),
			listCompletedBetween: ({ ownerId, from, to }) =>
				db.run(
					'TaskRepository.listCompletedBetween',
					async database =>
						await ownedTasks(database, ownerId).list(
							and(gte(task.completedAt, from), lt(task.completedAt, to)),
							// Keep in sync with compareCompleted in task-completion.helper.ts.
							[desc(task.completedAt), desc(task.createdAt)]
						)
				),
			find: ({ ownerId, id }) =>
				db.run(
					'TaskRepository.find',
					async database => await ownedTasks(database, ownerId).find(id)
				),
			create: ({
				ownerId,
				title,
				description,
				dueDate,
				dueTime,
				priority,
				repeat,
				labelIds = [],
				goal,
				projectId,
			}) =>
				db.run(
					'TaskRepository.create',
					async database =>
						await database.transaction(async transaction => {
							const [row] = await transaction
								.insert(task)
								.values({
									ownerId,
									title,
									description: description || null,
									dueDate,
									dueTime: dueTime ?? null,
									priority: priority ?? DEFAULT_TASK_PRIORITY,
									repeatUnit: repeat?.unit ?? null,
									repeatInterval: repeat?.interval ?? null,
									repeatAnchor: repeat?.anchor ?? null,
									goalTarget: goal?.target ?? null,
									goalUnit: goal?.unit ?? null,
									projectId: projectId ?? null,
								})
								.returning()

							if (!row) throw new Error('Task insert returned no row')
							if (labelIds.length === 0 && !projectId) return toTask(row, [])

							const tasks = ownedTasks(transaction, ownerId)

							if (labelIds.length > 0)
								await tasks.assignLabels(row.id, labelIds)
							const [created] = await tasks.withLabelsAndProject([row])

							return created ?? toTask(row, [])
						})
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
				db.run('TaskRepository.delete', async database => {
					const [row] = await ownedTasks(database, ownerId)
						.delete(eq(task.id, id))
						.returning({ id: task.id })

					return row?.id
				}),
			count: ownerId =>
				db.run(
					'TaskRepository.count',
					async database => await ownedTasks(database, ownerId).count()
				),
			setCompletion: ({ ownerId, id, completedAt, dueDate, progress, goal }) =>
				db.run('TaskRepository.setCompletion', async database => {
					const tasks = ownedTasks(database, ownerId)
					const rows = await tasks
						.update(
							{
								completedAt: completedAt ?? null,
								dueDate,
								...(goal && {
									goalTarget: goal.target,
									goalUnit: goal.unit ?? null,
								}),
								goalProgress: getRestoredProgress(progress, goal),
							},
							eq(task.id, id)
						)
						.returning()
					const [updated] = await tasks.withLabelsAndProject(rows)

					return updated
				}),
			advanceDueDate: ({ ownerId, id, from, to }) =>
				db.run('TaskRepository.advanceDueDate', async database => {
					const tasks = ownedTasks(database, ownerId)
					const rows = await tasks
						.update(
							{ dueDate: to, goalProgress: 0 },
							and(
								eq(task.id, id),
								eq(task.dueDate, from),
								isNotNull(task.repeatUnit)
							)
						)
						.returning()
					const [advanced] = await tasks.withLabelsAndProject(rows)

					return advanced
				}),
			rescheduleOpen: ({ ownerId, ids, dueDate }) =>
				db.run('TaskRepository.rescheduleOpen', async database => {
					const tasks = ownedTasks(database, ownerId)
					const rows = await tasks
						.update(
							{ dueDate },
							and(inArray(task.id, ids), isNull(task.completedAt))
						)
						.returning()

					return await tasks.withLabelsAndProject(rows)
				}),
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
							const row = await updateProgress(transaction, log)

							if (!row) return undefined

							const [logged] = await ownedTasks(
								transaction,
								log.ownerId
							).withLabelsAndProject([row])
							const completed = row.completed
								? {
										dueDate: row.previousDueDate,
										progress: row.previousProgress,
									}
								: undefined

							return logged && { task: logged, logged: row.logged, completed }
						})
				),
		})
	})
)
