import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { Skeleton } from '@soonlane/ui/components/skeleton'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getHostPorts } from '../../../../host-ports.client'
import { orpcQuery } from '../../../../rpc-query.client'
import {
	getAddSubtaskState,
	SUBTASK_LIMIT_HINT,
} from '../../helpers/subtask.helper'
import { useReopenTask } from '../../hooks/use-reopen-task'
import { useSubtaskComposer } from '../../hooks/use-subtask-composer'
import { TaskComposer } from '../composer/task-composer'
import { AddTaskRow } from '../list/add-task-row'
import { TaskListError } from '../list/task-list-error'
import { CompletedTaskItem } from './completed-task-item'
import { TaskItem, type TaskItemProps } from './task-item'

interface TaskTreeItemProps extends Omit<
	TaskItemProps,
	'isInParent' | 'editorId' | 'isExpanded' | 'onExpandedChange' | 'onAddSubtask'
> {
	/** The editor id of the row it shows under, for a subtask in its parent's expansion. */
	parentEditorId?: string
}

interface SubtaskListProps {
	parent: Task
	editorId: string
	today: CalendarDate
	onComplete: (task: Task) => void
}

/** A task row followed, while expanded, by its subtasks; collapsed until opened, on every visit. */
export function TaskTreeItem({
	parentEditorId,
	...props
}: Readonly<TaskTreeItemProps>) {
	const { task, today, onComplete } = props
	const [isExpanded, setIsExpanded] = useState(false)
	const editorId = parentEditorId ? `${parentEditorId}/${task.id}` : task.id
	const composer = useSubtaskComposer(editorId)

	return (
		<>
			<TaskItem
				{...props}
				editorId={editorId}
				isExpanded={isExpanded}
				isInParent={parentEditorId !== undefined}
				onAddSubtask={() => {
					setIsExpanded(true)
					composer.open()
				}}
				onExpandedChange={setIsExpanded}
			/>

			{isExpanded && (
				<SubtaskList
					editorId={editorId}
					onComplete={onComplete}
					parent={task}
					today={today}
				/>
			)}
		</>
	)
}

/**
 * An expanded task's direct subtasks, one step indented: open ones as task rows, completed ones in their place with their
 * reopen circle, then "Add subtask", whose composer starts without a date, keeps the parent's project and closes after a create.
 */
function SubtaskList({
	parent,
	editorId,
	today,
	onComplete,
}: Readonly<SubtaskListProps>) {
	const { capture } = getHostPorts()
	const { data, isPending, isError, refetch } = useQuery(
		orpcQuery.tasks.listSubtasks.queryOptions({ input: { id: parent.id } })
	)
	const { isCompleting, reopenTask } = useReopenTask(today)
	const composer = useSubtaskComposer(editorId)
	const [shouldFocusAdd, setShouldFocusAdd] = useState(false)
	const addState = getAddSubtaskState(parent)

	function closeComposer() {
		composer.close()
		setShouldFocusAdd(true)
	}

	return (
		<li className="pl-6">
			<ul>
				{isPending && (
					<li aria-busy className="border-b py-3">
						<Skeleton className="h-4 w-2/5" />
					</li>
				)}

				{data?.tasks.map(subtask =>
					subtask.completedAt ? (
						<CompletedTaskItem
							isDisabled={isCompleting}
							isInParent
							key={subtask.id}
							onReopen={() => reopenTask(subtask)}
							task={subtask}
						/>
					) : (
						<TaskTreeItem
							key={subtask.id}
							onComplete={onComplete}
							parentEditorId={editorId}
							showsDueDay
							task={subtask}
							today={today}
						/>
					)
				)}
			</ul>

			{isError && <TaskListError onRetry={() => void refetch()} />}

			{composer.isAdding ? (
				<TaskComposer
					defaultDueDate={undefined}
					onCancel={() => {
						capture('composer_cancelled', { source: 'subtask' })
						closeComposer()
					}}
					onCreated={closeComposer}
					parentId={parent.id}
					source="subtask"
					today={today}
				/>
			) : (
				addState !== 'hidden' && (
					<AddTaskRow
						autoFocus={shouldFocusAdd}
						disabledHint={addState === 'full' ? SUBTASK_LIMIT_HINT : undefined}
						label="Add subtask"
						onClick={() => {
							composer.open()
							setShouldFocusAdd(false)
						}}
					/>
				)
			)}
		</li>
	)
}
