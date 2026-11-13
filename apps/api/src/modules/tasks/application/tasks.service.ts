import type {
	CreateTaskInput,
	EditTaskInput,
	ListCompletedTasksInput,
	ListCompletedTasksOutput,
	ListTasksInput,
	ListTasksOutput,
	RescheduleTasksInput,
	LogProgressOutput,
	SearchTasksInput,
	SearchTasksOutput,
	Task,
	UpdateTaskOutput,
} from '@soonlane/contracts'
import {
	type LabelId,
	type ProjectId,
	type TaskId,
	type UserId,
	getFirstOccurrence,
} from '@soonlane/domain'
import { Clock, Context, Effect, Layer } from 'effect'
import { Analytics } from '@/modules/analytics/application/analytics.port'
import type { LabelNotFound } from '@/modules/labels/domain/label.errors'
import { ProjectNotFound } from '@/modules/projects/domain/project.errors'
import type { DbError } from '@/platform/db/db.errors'
import type {
	TaskDurationWithoutTime,
	TaskNotFound,
} from '../domain/task.errors'
import { TaskRepository } from '../infrastructure/task.repository'
import {
	type CompletionDates,
	type RestoredOccurrence,
	failDeletedProject,
	failTimelessDuration,
	getAdvance,
	getScheduleUpdate,
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
		) => Effect.Effect<
			ListTasksOutput,
			LabelNotFound | ProjectNotFound | DbError
		>
		readonly listCompleted: (
			ownerId: UserId,
			input: ListCompletedTasksInput
		) => Effect.Effect<ListCompletedTasksOutput, DbError>
		readonly search: (
			ownerId: UserId,
			input: SearchTasksInput
		) => Effect.Effect<SearchTasksOutput, DbError>
		readonly get: (
			ownerId: UserId,
			id: TaskId
		) => Effect.Effect<Task, TaskNotFound | DbError>
		/** Every open task, with or without a due date, in day order. */
		readonly listOpen: (ownerId: UserId) => Effect.Effect<Task[], DbError>
		readonly create: (
			ownerId: UserId,
			input: CreateTaskInput
		) => Effect.Effect<Task, ProjectNotFound | DbError>
		readonly edit: (
			ownerId: UserId,
			id: TaskId,
			input: EditTaskInput
		) => Effect.Effect<
			UpdateTaskOutput,
			TaskNotFound | ProjectNotFound | TaskDurationWithoutTime | DbError
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
			{ today, from, to, labelId, projectId }: ListTasksInput
		) {
			if (labelId)
				yield* requireLabel(yield* repository.findLabel({ ownerId, labelId }))
			if (projectId) yield* requireProject(ownerId, projectId)

			const tasks = yield* repository.listOpen({
				ownerId,
				labelId,
				projectId,
				range: from && to ? { before: today, from, to } : undefined,
			})

			return splitAtToday(tasks, { today, labelId, projectId })
		})

		// The bounds are the client's local midnights, since only it knows the owner's time zone.
		const listCompleted = Effect.fn('TasksService.listCompleted')(function* (
			ownerId: UserId,
			{ from, to }: ListCompletedTasksInput
		) {
			return yield* Effect.all(
				{
					tasks: repository.listCompletedBetween({ ownerId, from, to }),
					earlierCompletedAt: repository.findLatestCompletedAt({
						ownerId,
						before: from,
					}),
				},
				{ concurrency: 'unbounded' }
			)
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

		const get = Effect.fn('TasksService.get')(function* (
			ownerId: UserId,
			id: TaskId
		) {
			return yield* requireTask(yield* repository.find({ ownerId, id }))
		})

		const listOpen = Effect.fn('TasksService.listOpen')(function* (
			ownerId: UserId
		) {
			return yield* repository.listOpen({ ownerId })
		})

		const create = Effect.fn('TasksService.create')(function* (
			ownerId: UserId,
			input: CreateTaskInput
		) {
			if (input.projectId) yield* requireProject(ownerId, input.projectId)

			const dueDate =
				input.dueDate && getFirstOccurrence(input.dueDate, input.repeat?.unit)
			const task = yield* repository
				.create({
					...input,
					ownerId,
					dueDate,
					repeat: dueDate &&
						input.repeat && { ...input.repeat, anchor: dueDate },
				})
				.pipe(Effect.catchTag('DbError', failDeletedProject))
			// The task is saved: a failed count skips the event instead of failing the request.
			const count = yield* repository
				.count(ownerId)
				.pipe(Effect.orElseSucceed(() => 0))

			if (count === 1)
				yield* analytics.capture(ownerId, 'first_task_created', {
					taskId: task.id,
				})

			return task
		})

		const edit = Effect.fn('TasksService.edit')(function* (
			ownerId: UserId,
			id: TaskId,
			{ today, ...input }: EditTaskInput
		) {
			const current = yield* requireTask(
				yield* repository.find({ ownerId, id })
			)

			if (input.projectId) yield* requireProject(ownerId, input.projectId)

			const schedule = yield* getScheduleUpdate(current, input, today)
			const editedAt = new Date(yield* Clock.currentTimeMillis)

			return yield* requireTask(
				yield* repository
					.update({
						...input,
						ownerId,
						id,
						...schedule,
						editedAt,
					})
					.pipe(
						Effect.catchTag('DbError', failDeletedProject),
						Effect.catchTag('DbError', failTimelessDuration)
					)
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
			const advance = getAdvance(task, seen)

			if (!advance) {
				const completedAt = new Date(yield* Clock.currentTimeMillis)

				return yield* requireTask(
					yield* repository.setCompletion({ ownerId, id, completedAt })
				)
			}

			const advanced = yield* repository.advanceDueDate({
				ownerId,
				id,
				...advance,
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
					advance: getAdvance(task, seen),
				})
			)
		})

		return TasksService.of({
			list,
			listCompleted,
			search,
			get,
			listOpen,
			create,
			edit,
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
