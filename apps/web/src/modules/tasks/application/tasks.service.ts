import type {
	CreateTaskInput,
	ListTasksInput,
	ListTasksOutput,
	RescheduleTasksInput,
	Task,
	UpdateTaskInput,
} from '@soonlane/contracts'
import {
	type CalendarDate,
	type TaskId,
	toCalendarDate,
	toTaskId,
	type UserId,
} from '@soonlane/domain'
import { Clock, Context, Effect, Layer } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import {
	getEditedDueDate,
	getEditedRule,
	getFirstOccurrence,
	getNextDueDate,
} from '../domain/repeat-rule.helper'
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
			id: TaskId,
			seen: CompletionDates
		) => Effect.Effect<Task, TaskNotFound | DbError>
		readonly uncomplete: (
			ownerId: UserId,
			id: TaskId,
			dueDate?: CalendarDate
		) => Effect.Effect<Task, TaskNotFound | DbError>
		readonly reschedule: (
			ownerId: UserId,
			input: RescheduleTasksInput
		) => Effect.Effect<Task[], DbError>
	}
>()('soonlane/TasksService') {}

/** The client's today and the due date it showed; both absent from older clients. */
interface CompletionDates {
	today?: CalendarDate
	dueDate?: CalendarDate
}

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
			const dueDate = getFirstOccurrence(
				toCalendarDate(input.dueDate),
				input.repeat?.unit
			)

			return yield* repository.create({
				...input,
				ownerId,
				dueDate,
				repeat: input.repeat && { ...input.repeat, anchor: dueDate },
			})
		})

		const update = Effect.fn('TasksService.update')(function* (
			ownerId: UserId,
			id: TaskId,
			input: UpdateTaskInput
		) {
			const current = yield* requireTask(
				yield* repository.find({ ownerId, id })
			)
			const repeat =
				input.repeat === undefined
					? current.repeat
					: (input.repeat ?? undefined)
			const dueDate = getEditedDueDate(
				current,
				toCalendarDate(input.dueDate),
				repeat?.unit
			)

			return yield* requireTask(
				yield* repository.update({
					...input,
					ownerId,
					id,
					dueDate,
					repeat: getEditedRule(current, dueDate, repeat),
				})
			)
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

			// From the date the client saw, so a stale list cannot advance the task twice.
			const dueDate = seen.dueDate ?? toCalendarDate(task.dueDate)
			const rule = {
				...task.repeat,
				anchor: toCalendarDate(task.repeat.anchor),
			}
			const advanced = yield* repository.advanceDueDate({
				ownerId,
				id,
				from: dueDate,
				to: getNextDueDate(dueDate, rule, seen.today),
			})

			return (
				advanced ??
				(yield* requireTask(yield* repository.find({ ownerId, id })))
			)
		})

		const uncomplete = Effect.fn('TasksService.uncomplete')(function* (
			ownerId: UserId,
			id: TaskId,
			dueDate?: CalendarDate
		) {
			return yield* requireTask(
				yield* repository.setCompletion({ ownerId, id, dueDate })
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
