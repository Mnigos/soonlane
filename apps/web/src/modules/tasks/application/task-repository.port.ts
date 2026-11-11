import type {
	CreateTaskInput,
	GoalInput,
	Label,
	LogProgressOutput,
	Task,
	UpdateTaskInput,
	UpdateTaskOutput,
} from '@soonlane/contracts'
import type { CalendarDate, LabelId, TaskId, UserId } from '@soonlane/domain'
import { Context, type Effect } from 'effect'
import type { DbError } from '@/platform/db/db.errors'
import type { RepeatRule } from '../domain/repeat-rule.helper'

export interface OpenTasksBetween {
	ownerId: UserId
	from: CalendarDate
	to: CalendarDate
}

export interface OpenTasksBefore {
	ownerId: UserId
	before: CalendarDate
}

export interface CompletedTasksBetween {
	ownerId: UserId
	from: Date
	to: Date
}

export interface NewTask extends Omit<CreateTaskInput, 'repeat'> {
	ownerId: UserId
	repeat?: RepeatRule
}

/** `nextDueDate` is where the edited rule moves the task when its new goal completes it. */
export interface TaskUpdate extends Omit<UpdateTaskInput, 'repeat' | 'today'> {
	ownerId: UserId
	id: TaskId
	repeat?: RepeatRule
	nextDueDate?: CalendarDate
	editedAt: Date
}

export interface TaskCompletion {
	ownerId: UserId
	id: TaskId
	completedAt?: Date
	dueDate?: CalendarDate
	progress?: number
	goal?: GoalInput
}

export interface TaskKey {
	ownerId: UserId
	id: TaskId
}

/** Moves the due date only while it is still `from`, so concurrent completions advance it once. */
export interface DueDateAdvance extends TaskKey {
	from: CalendarDate
	to: CalendarDate
}

export interface TaskReschedule {
	ownerId: UserId
	ids: TaskId[]
	dueDate: CalendarDate
}

export interface TaskLabel {
	ownerId: UserId
	id: TaskId
	labelId: LabelId
}

export interface ProgressLog extends TaskKey {
	amount: number
	loggedAt: Date
	advance?: Omit<DueDateAdvance, keyof TaskKey>
}

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
