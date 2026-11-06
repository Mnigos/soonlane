import type {
	CreateTaskInput,
	ListTasksInput,
	ListTasksOutput,
	RescheduleTasksInput,
	Task,
	UpdateTaskInput,
} from '@soonlane/contracts'
import {
	type TaskId,
	toCalendarDate,
	toTaskId,
	type UserId,
} from '@soonlane/domain'
import { Clock, Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import { TaskNotFound } from '../domain/task.errors'
import { TaskRepository } from './task-repository.port'

export class TasksService extends Context.Service<
	TasksService,
	{
		readonly list: (
			ownerId: UserId,
			input: ListTasksInput
		) => Effect.Effect<ListTasksOutput, DbError>
		readonly create: (
			ownerId: UserId,
			input: CreateTaskInput
		) => Effect.Effect<Task, DbError>
		readonly update: (
			ownerId: UserId,
			id: TaskId,
			input: UpdateTaskInput
		) => Effect.Effect<Task, TaskNotFound | DbError>
		readonly complete: (
			ownerId: UserId,
			id: TaskId
		) => Effect.Effect<Task, TaskNotFound | DbError>
		readonly uncomplete: (
			ownerId: UserId,
			id: TaskId
		) => Effect.Effect<Task, TaskNotFound | DbError>
		readonly reschedule: (
			ownerId: UserId,
			input: RescheduleTasksInput
		) => Effect.Effect<Task[], DbError>
	}
>()('soonlane/TasksService') {}

function requireTask(task: Task | undefined) {
	return task ? Effect.succeed(task) : Effect.fail(new TaskNotFound())
}

export const TasksServiceLive = Layer.effect(
	TasksService,
	Effect.gen(function* () {
		const repository = yield* TaskRepository

		// "Today" comes from the client: the server cannot know the owner's time zone.
		const list = Effect.fn('TasksService.list')(function* (
			ownerId: UserId,
			{ from, to, today }: ListTasksInput
		) {
			const [overdue, scheduled] = yield* Effect.all(
				[
					repository.listOpenBefore({ ownerId, before: toCalendarDate(today) }),
					repository.listOpenBetween({
						ownerId,
						from: toCalendarDate(from),
						to: toCalendarDate(to),
					}),
				],
				{ concurrency: 2 }
			)

			return { overdue, scheduled }
		})

		const create = Effect.fn('TasksService.create')(function* (
			ownerId: UserId,
			input: CreateTaskInput
		) {
			return yield* repository.create({ ...input, ownerId })
		})

		const update = Effect.fn('TasksService.update')(function* (
			ownerId: UserId,
			id: TaskId,
			input: UpdateTaskInput
		) {
			return yield* requireTask(
				yield* repository.update({ ...input, ownerId, id })
			)
		})

		const complete = Effect.fn('TasksService.complete')(function* (
			ownerId: UserId,
			id: TaskId
		) {
			const completedAt = new Date(yield* Clock.currentTimeMillis)

			return yield* requireTask(
				yield* repository.setCompletion({ ownerId, id, completedAt })
			)
		})

		const uncomplete = Effect.fn('TasksService.uncomplete')(function* (
			ownerId: UserId,
			id: TaskId
		) {
			return yield* requireTask(
				yield* repository.setCompletion({ ownerId, id })
			)
		})

		const reschedule = Effect.fn('TasksService.reschedule')(function* (
			ownerId: UserId,
			{ ids, dueDate }: RescheduleTasksInput
		) {
			return yield* repository.rescheduleOpen({
				ownerId,
				ids: ids.map(toTaskId),
				dueDate: toCalendarDate(dueDate),
			})
		})

		return TasksService.of({
			list,
			create,
			update,
			complete,
			uncomplete,
			reschedule,
		})
	})
)
