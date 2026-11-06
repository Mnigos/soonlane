import type {
	CreateTaskInput,
	Task,
	UpdateTaskInput,
} from '@soonlane/contracts'
import type { CalendarDate, TaskId, UserId } from '@soonlane/domain'
import { Context, type Effect } from 'effect'
import type { DbError } from '@/platform/db/db.errors'

export interface OpenTasksBetween {
	ownerId: UserId
	from: CalendarDate
	to: CalendarDate
}

export interface OpenTasksBefore {
	ownerId: UserId
	before: CalendarDate
}

export interface NewTask extends CreateTaskInput {
	ownerId: UserId
}

export interface TaskUpdate extends UpdateTaskInput {
	ownerId: UserId
	id: TaskId
}

export interface TaskCompletion {
	ownerId: UserId
	id: TaskId
	completedAt?: Date
}

export class TaskRepository extends Context.Service<
	TaskRepository,
	{
		readonly listOpenBetween: (
			params: OpenTasksBetween
		) => Effect.Effect<Task[], DbError>
		readonly listOpenBefore: (
			params: OpenTasksBefore
		) => Effect.Effect<Task[], DbError>
		readonly create: (task: NewTask) => Effect.Effect<Task, DbError>
		readonly update: (
			update: TaskUpdate
		) => Effect.Effect<Task | undefined, DbError>
		readonly setCompletion: (
			completion: TaskCompletion
		) => Effect.Effect<Task | undefined, DbError>
	}
>()('soonlane/TaskRepository') {}
