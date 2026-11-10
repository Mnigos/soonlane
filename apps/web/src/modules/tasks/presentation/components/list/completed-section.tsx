import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import {
	useIsMutating,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query'
import { useState } from 'react'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { getUndoCallbacks } from '../../helpers/task-completion.helper'
import { CompletedTaskItem } from '../task/completed-task-item'
import { SectionToggle } from './section-toggle'

interface CompletedSectionProps {
	tasks: Task[]
	today: CalendarDate
}

/** Today's completed tasks, collapsed on every visit; the count stays visible. */
export function CompletedSection({
	tasks,
	today,
}: Readonly<CompletedSectionProps>) {
	const [isOpen, setIsOpen] = useState(false)
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
		<section aria-labelledby="completed-heading" className="pt-4">
			<h2
				className="border-b pb-2 text-sm font-semibold"
				id="completed-heading"
			>
				<SectionToggle
					controls="completed-tasks"
					isOpen={isOpen}
					onToggle={() => setIsOpen(open => !open)}
				>
					Completed
					<span className="font-normal text-muted-foreground">
						{tasks.length}
					</span>
				</SectionToggle>
			</h2>

			{isOpen && (
				<ul id="completed-tasks">
					{tasks.map(task => (
						<CompletedTaskItem
							isDisabled={isCompleting}
							key={task.id}
							onReopen={() => reopen.mutate({ id: task.id })}
							task={task}
						/>
					))}
				</ul>
			)}
		</section>
	)
}
