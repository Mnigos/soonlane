import type { Task } from '@soonlist/contracts'
import { cn } from '@soonlist/ui/cn'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { TaskList } from './task-list'

interface OverdueSectionProps {
	tasks: Task[]
	isLoading: boolean
	onComplete: (task: Task) => void
}

export function OverdueSection({
	tasks,
	isLoading,
	onComplete,
}: Readonly<OverdueSectionProps>) {
	const [isOpen, setIsOpen] = useState(true)

	return (
		<section aria-labelledby="overdue-heading" className="pt-4">
			<div className="flex items-center justify-between gap-4 border-b pb-2">
				<h2 className="text-sm font-semibold" id="overdue-heading">
					<button
						aria-controls="overdue-tasks"
						aria-expanded={isOpen}
						className="flex cursor-pointer items-center gap-1.5 md:-ml-6"
						onClick={() => setIsOpen(open => !open)}
						type="button"
					>
						<ChevronDown
							aria-hidden
							className={cn(
								'size-4.5 text-muted-foreground transition-transform',
								!isOpen && '-rotate-90'
							)}
						/>
						Overdue
					</button>
				</h2>

				<button
					className="cursor-pointer text-sm font-medium text-danger hover:underline disabled:cursor-default disabled:opacity-50 disabled:hover:no-underline"
					disabled
					type="button"
				>
					Reschedule
				</button>
			</div>

			{isOpen && (
				<div id="overdue-tasks">
					{!isLoading && tasks.length === 0 ? (
						<p className="py-3 text-sm text-faint-foreground">
							Nothing overdue.
						</p>
					) : (
						<TaskList
							isLoading={isLoading}
							onComplete={onComplete}
							tasks={tasks}
						/>
					)}
				</div>
			)}
		</section>
	)
}
