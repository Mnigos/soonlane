import type {
	CreateTaskInput,
	EditTaskInput,
	GoalInput,
} from '@soonlane/contracts'
import type {
	CalendarDate,
	LabelId,
	ProjectId,
	RepeatRule,
	TaskId,
	UserId,
} from '@soonlane/domain'

/** Every condition given applies; `range` keeps the tasks due before `before` or from `from` through `to`. */
export interface OpenTasks {
	ownerId: UserId
	labelId?: LabelId
	projectId?: ProjectId
	range?: { before: CalendarDate; from: CalendarDate; to: CalendarDate }
}

export interface CompletedTasksBetween {
	ownerId: UserId
	from: Date
	to: Date
}

export interface MatchingTasks {
	ownerId: UserId
	query: string
	limit: number
}

export interface NewTask extends Omit<CreateTaskInput, 'repeat'> {
	ownerId: UserId
	repeat?: RepeatRule
}

/** Absent keeps a column and null clears it; `nextDueDate` is where the task's rule moves it when the goal the edit leaves completes it. */
export interface TaskUpdate extends Omit<EditTaskInput, 'repeat' | 'today'> {
	ownerId: UserId
	repeat?: RepeatRule | null
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

export interface TaskProject {
	ownerId: UserId
	projectId: ProjectId
}

export interface ProgressLog extends TaskKey {
	amount: number
	loggedAt: Date
	advance?: Omit<DueDateAdvance, keyof TaskKey>
}
