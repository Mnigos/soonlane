import type {
	CreateTaskInput,
	GoalInput,
	UpdateTaskInput,
} from '@soonlane/contracts'
import type {
	CalendarDate,
	LabelId,
	RepeatRule,
	TaskId,
	UserId,
} from '@soonlane/domain'

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
