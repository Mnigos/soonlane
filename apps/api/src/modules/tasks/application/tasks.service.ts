import type {
	CreateTaskInput,
	ListCompletedTasksInput,
	ListTasksByLabelInput,
	ListTasksByProjectInput,
	ListTasksInput,
	ListTasksOutput,
	RescheduleTasksInput,
	LogProgressOutput,
	SearchTasksInput,
	SearchTasksOutput,
	Task,
	UpdateTaskInput,
	UpdateTaskOutput,
} from '@soonlane/contracts'
import {
	type LabelId,
	type ProjectId,
	type TaskId,
	type UserId,
	getEditedDueDate,
	getEditedRule,
	getFirstOccurrence,
	getNextDueDate,
} from '@soonlane/domain'
import { Clock, Context, Effect, Layer } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import type { LabelNotFound } from '@/modules/labels/domain/label.errors'
import { ProjectNotFound } from '@/modules/projects/domain/project.errors'
import type { DbError } from '@/platform/db/db.errors'
import type { TaskNotFound } from '../domain/task.errors'
import { TaskRepository } from '../infrastructure/task.repository'
import {
	type CompletionDates,
	type RestoredOccurrence,
	failDeletedProject,
	getAdvance,
	requireLabel,
	requireTask,
	splitAtToday,
} from './tasks.service.helper'

export class TasksService extends Context.Service<
	TasksService,
	{
		readonly list: (
			ownerId: UserId,
			input: ListTasksInput
		) => Effect.Effect<ListTasksOutput, DbError>
		readonly listByLabel: (
			ownerId: UserId,
			input: ListTasksByLabelInput
		) => Effect.Effect<ListTasksOutput, LabelNotFound | DbError>
		readonly listByProject: (
			ownerId: UserId,
			input: ListTasksByProjectInput
		) => Effect.Effect<ListTasksOutput, ProjectNotFound | DbError>
		readonly listCompleted: (
			ownerId: UserId,
			input: ListCompletedTasksInput
		) => Effect.Effect<Task[], DbError>
		readonly search: (
			ownerId: UserId,
			input: SearchTasksInput
		) => Effect.Effect<SearchTasksOutput, DbError>
		/** Every open task with any due date, in day order. */
		readonly listOpen: (ownerId: UserId) => Effect.Effect<Task[], DbError>
		readonly create: (
			ownerId: UserId,
			input: CreateTaskInput
		) => Effect.Effect<Task, ProjectNotFound | DbError>
		readonly update: (
			ownerId: UserId,
			id: TaskId,
			input: UpdateTaskInput
		) => Effect.Effect<
			UpdateTaskOutput,
			TaskNotFound | ProjectNotFound | DbError
		>
		readonly delete: (
			ownerId: UserId,
			id: TaskId
		) => Effect.Effect<void, TaskNotFound | DbError>
		readonly complete: (
			ownerId: UserId,
			id: TaskId,
			seen: CompletionDates
		) => Effect.Effect<Task, TaskNotFound | DbError>
		readonly uncomplete: (
			ownerId: UserId,
			id: TaskId,
			restored: RestoredOccurrence
		) => Effect.Effect<Task, TaskNotFound | DbError>
		readonly reschedule: (
			ownerId: UserId,
			input: RescheduleTasksInput
		) => Effect.Effect<Task[], DbError>
		readonly assignLabel: (
			ownerId: UserId,
			id: TaskId,
			labelId: LabelId
		) => Effect.Effect<Task, TaskNotFound | LabelNotFound | DbError>
		readonly unassignLabel: (
			ownerId: UserId,
			id: TaskId,
			labelId: LabelId
		) => Effect.Effect<Task, TaskNotFound | LabelNotFound | DbError>
		readonly logProgress: (
			ownerId: UserId,
			id: TaskId,
			amount: number,
			seen: CompletionDates
		) => Effect.Effect<LogProgressOutput, TaskNotFound | DbError>
	}
>()('soonlane/TasksService') {}

const SEARCH_RESULT_LIMIT = 50

export const TasksServiceLive = Layer.effect(
	TasksService,
	Effect.gen(function* () {
		const repository = yield* TaskRepository
		const analytics = yield* Analytics

		const requireProject = (ownerId: UserId, projectId: ProjectId) =>
			repository
				.findProject({ ownerId, projectId })
				.pipe(
					Effect.flatMap(project =>
						project ? Effect.void : Effect.fail(new ProjectNotFound())
					)
				)

		// "Today" comes from the client: the server cannot know the owner's time zone.
		const list = Effect.fn('TasksService.list')(function* (
			ownerId: UserId,
			{ from, to, today }: ListTasksInput
		) {
			const [overdue, scheduled] = yield* Effect.all(
				[
					repository.listOpenBefore({ ownerId, before: today }),
					repository.listOpenBetween({ ownerId, from, to }),
				],
				{ concurrency: 2 }
			)

			return { overdue, scheduled }
		})

		const listByLabel = Effect.fn('TasksService.listByLabel')(function* (
			ownerId: UserId,
			{ labelId, today }: ListTasksByLabelInput
		) {
			const label = { ownerId, labelId }

			yield* requireLabel(yield* repository.findLabel(label))

			return splitAtToday(yield* repository.listOpenWithLabel(label), today)
		})

		const listByProject = Effect.fn('TasksService.listByProject')(function* (
			ownerId: UserId,
			{ projectId, today }: ListTasksByProjectInput
		) {
			yield* requireProject(ownerId, projectId)

			return splitAtToday(
				yield* repository.listOpenInProject({ ownerId, projectId }),
				today
			)
		})

		// The bounds are the client's local midnights, since only it knows the owner's time zone.
		const listCompleted = Effect.fn('TasksService.listCompleted')(function* (
			ownerId: UserId,
			{ from, to }: ListCompletedTasksInput
		) {
			return yield* repository.listCompletedBetween({ ownerId, from, to })
		})

		const search = Effect.fn('TasksService.search')(function* (
			ownerId: UserId,
			{ query }: SearchTasksInput
		) {
			const tasks = yield* repository.listMatching({
				ownerId,
				query,
				limit: SEARCH_RESULT_LIMIT + 1,
			})

			return {
				tasks: tasks.slice(0, SEARCH_RESULT_LIMIT),
				hasMore: tasks.length > SEARCH_RESULT_LIMIT,
			}
		})

		const listOpen = Effect.fn('TasksService.listOpen')(function* (
			ownerId: UserId
		) {
			return yield* repository.listOpen(ownerId)
		})

		const create = Effect.fn('TasksService.create')(function* (
			ownerId: UserId,
			input: CreateTaskInput
		) {
			if (input.projectId) yield* requireProject(ownerId, input.projectId)

			const dueDate = getFirstOccurrence(input.dueDate, input.repeat?.unit)
			const task = yield* repository
				.create({
					...input,
					ownerId,
					dueDate,
					repeat: input.repeat && { ...input.repeat, anchor: dueDate },
				})
				.pipe(Effect.catchTag('DbError', failDeletedProject))
			// The task is saved: a failed count skips the event instead of failing the request.
			const count = yield* repository
				.count(ownerId)
				.pipe(Effect.orElseSucceed(() => 0))

			if (count === 1)
				yield* analytics.capture(ownerId, 'first_task_created', {
					task_id: task.id,
				})

			return task
		})

		const update = Effect.fn('TasksService.update')(function* (
			ownerId: UserId,
			id: TaskId,
			{ today, ...input }: UpdateTaskInput
		) {
			const current = yield* requireTask(
				yield* repository.find({ ownerId, id })
			)

			if (input.projectId) yield* requireProject(ownerId, input.projectId)

			const repeat =
				input.repeat === undefined
					? current.repeat
					: (input.repeat ?? undefined)
			const dueDate = getEditedDueDate(current, input.dueDate, repeat?.unit)
			const rule = getEditedRule(current, dueDate, repeat)
			const editedAt = new Date(yield* Clock.currentTimeMillis)

			return yield* requireTask(
				yield* repository
					.update({
						...input,
						ownerId,
						id,
						dueDate,
						repeat: rule,
						nextDueDate: rule && getNextDueDate(dueDate, rule, today),
						editedAt,
					})
					.pipe(Effect.catchTag('DbError', failDeletedProject))
			)
		})

		const remove = Effect.fn('TasksService.delete')(function* (
			ownerId: UserId,
			id: TaskId
		) {
			yield* requireTask(yield* repository.delete({ ownerId, id }))
		})

		// A repeating task stays open and moves to its next occurrence instead.
		const complete = Effect.fn('TasksService.complete')(function* (
			ownerId: UserId,
			id: TaskId,
			seen: CompletionDates
		) {
			const task = yield* requireTask(yield* repository.find({ ownerId, id }))

			if (!task.repeat) {
				const completedAt = new Date(yield* Clock.currentTimeMillis)

				return yield* requireTask(
					yield* repository.setCompletion({ ownerId, id, completedAt })
				)
			}

			const advanced = yield* repository.advanceDueDate({
				ownerId,
				id,
				...getAdvance(task.dueDate, task.repeat, seen),
			})

			return (
				advanced ??
				(yield* requireTask(yield* repository.find({ ownerId, id })))
			)
		})

		const uncomplete = Effect.fn('TasksService.uncomplete')(function* (
			ownerId: UserId,
			id: TaskId,
			restored: RestoredOccurrence
		) {
			return yield* requireTask(
				yield* repository.setCompletion({ ownerId, id, ...restored })
			)
		})

		const reschedule = Effect.fn('TasksService.reschedule')(function* (
			ownerId: UserId,
			{ ids, dueDate }: RescheduleTasksInput
		) {
			return yield* repository.rescheduleOpen({ ownerId, ids, dueDate })
		})

		const assignLabel = Effect.fn('TasksService.assignLabel')(function* (
			ownerId: UserId,
			id: TaskId,
			labelId: LabelId
		) {
			yield* requireLabel(yield* repository.findLabel({ ownerId, labelId }))

			return yield* requireTask(
				yield* repository.assignLabel({ ownerId, id, labelId })
			)
		})

		const unassignLabel = Effect.fn('TasksService.unassignLabel')(function* (
			ownerId: UserId,
			id: TaskId,
			labelId: LabelId
		) {
			yield* requireLabel(yield* repository.findLabel({ ownerId, labelId }))

			return yield* requireTask(
				yield* repository.unassignLabel({ ownerId, id, labelId })
			)
		})

		const logProgress = Effect.fn('TasksService.logProgress')(function* (
			ownerId: UserId,
			id: TaskId,
			amount: number,
			seen: CompletionDates
		) {
			const task = yield* requireTask(yield* repository.find({ ownerId, id }))
			const loggedAt = new Date(yield* Clock.currentTimeMillis)

			return yield* requireTask(
				yield* repository.logProgress({
					ownerId,
					id,
					amount,
					loggedAt,
					advance: task.repeat && getAdvance(task.dueDate, task.repeat, seen),
				})
			)
		})

		return TasksService.of({
			list,
			listByLabel,
			listByProject,
			listCompleted,
			search,
			listOpen,
			create,
			update,
			delete: remove,
			complete,
			uncomplete,
			reschedule,
			assignLabel,
			unassignLabel,
			logProgress,
		})
	})
)
