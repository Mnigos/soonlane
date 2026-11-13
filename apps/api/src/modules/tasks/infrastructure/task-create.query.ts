import type { Task } from '@soonlane/contracts'
import { task } from '@soonlane/db'
import {
	DEFAULT_TASK_PRIORITY,
	SUBTASK_DEPTH_MAX,
	SUBTASKS_PER_TASK_MAX,
	type TaskId,
} from '@soonlane/domain'
import { eq } from 'drizzle-orm'
import type { Database } from '@/platform/db/db.layer'
import {
	ParentTaskCompleted,
	SubtaskLimitReached,
	type SubtaskRefusal,
	SubtaskTooDeep,
	TaskNotFound,
} from '../domain/task.errors'
import { type OwnedTasks, ownedTasks } from './owned-tasks.query'
import { toRepeatColumns, toTask } from './task.mapper'
import type { NewTask } from './task.repository.types'

/** The columns a subtask takes from its locked parent, or why the parent takes none. */
async function getSubtaskColumns(tasks: OwnedTasks, parentId: TaskId) {
	const parent = await tasks.lockPath(parentId)

	if (!parent) return new TaskNotFound()
	if (parent.depth >= SUBTASK_DEPTH_MAX) return new SubtaskTooDeep()
	if (parent.completedAt) return new ParentTaskCompleted()
	if ((await tasks.count(eq(task.parentId, parentId))) >= SUBTASKS_PER_TASK_MAX)
		return new SubtaskLimitReached()

	return { parentId, depth: parent.depth + 1, projectId: parent.projectId }
}

/** Inserts the task with its labels; a subtask under its parent's lock, so its siblings' count holds. Returns why a parent took no subtask. */
export async function createTask(
	database: Database,
	{
		ownerId,
		parentId,
		title,
		description,
		dueDate,
		dueTime,
		durationMinutes,
		priority,
		repeat,
		labelIds = [],
		goal,
		projectId,
	}: NewTask
): Promise<Task | TaskNotFound | SubtaskRefusal> {
	return await database.transaction(async transaction => {
		const tasks = ownedTasks(transaction, ownerId)
		const subtask =
			parentId === undefined
				? undefined
				: await getSubtaskColumns(tasks, parentId)

		if (subtask && '_tag' in subtask) return subtask

		const [row] = await transaction
			.insert(task)
			.values({
				ownerId,
				title,
				description: description || null,
				dueDate,
				dueTime: dueTime ?? null,
				durationMinutes: durationMinutes ?? null,
				priority: priority ?? DEFAULT_TASK_PRIORITY,
				...toRepeatColumns(repeat),
				goalTarget: goal?.target ?? null,
				goalUnit: goal?.unit ?? null,
				projectId: projectId ?? null,
				...subtask,
			})
			.returning()

		if (!row) throw new Error('Task insert returned no row')
		if (labelIds.length === 0 && !row.projectId && !row.parentId)
			return toTask(row, { labels: [] })
		if (labelIds.length > 0) await tasks.assignLabels(row.id, labelIds)

		const [created] = await tasks.withRelations([row])

		return created ?? toTask(row, { labels: [] })
	})
}
