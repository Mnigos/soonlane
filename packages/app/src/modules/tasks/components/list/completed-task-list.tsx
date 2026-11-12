import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import {
	useIsMutating,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import { orpcQuery } from '../../../../rpc-query.client'
import { getUndoCallbacks } from '../../helpers/task-completion.helper'
import { CompletedTaskItem } from '../task/completed-task-item'

interface CompletedTaskListProps {
	id?: string
	tasks: Task[]
	today: CalendarDate
}

export function CompletedTaskList({
	id,
	tasks,
	today,
}: Readonly<CompletedTaskListProps>) {
	const queryClient = useQueryClient()
	// A reopen that lands before a pending completion would be undone by it.
	const isCompleting =
		useIsMutating({ mutationKey: orpcQuery.tasks.complete.mutationKey() }) > 0
	const reopen = useMutation(
		orpcQuery.tasks.uncomplete.mutationOptions(
			getUndoCallbacks(queryClient, today, 'reopen')
		)
	)

	return (
		<ul id={id}>
			{tasks.map(task => (
				<CompletedTaskItem
					isDisabled={isCompleting}
					key={task.id}
					onReopen={() => reopen.mutate({ id: task.id })}
					task={task}
				/>
			))}
		</ul>
	)
}
