import type { Task } from '@soonlane/contracts'
import type { PropsWithChildren, ReactNode } from 'react'
import { useCloseEditCard } from '../../hooks/use-close-edit-card'
import { SectionToggle } from './section-toggle'

interface CollapsibleTaskSectionProps extends PropsWithChildren {
	/** Prefixes the heading's and the list's element ids. */
	id: string
	heading: ReactNode
	action?: ReactNode
	tasks: Task[]
	isOpen: boolean
	onToggle: () => void
}

/** A list section above the days (Overdue, Inbox, No date) whose heading collapses its tasks. */
export function CollapsibleTaskSection({
	id,
	heading,
	action,
	tasks,
	isOpen,
	onToggle,
	children,
}: Readonly<CollapsibleTaskSectionProps>) {
	const closeEditCard = useCloseEditCard(tasks)

	return (
		<section aria-labelledby={`${id}-heading`} className="pt-4">
			<div className="flex items-center justify-between gap-4 border-b pb-2">
				<h2 className="text-sm font-semibold" id={`${id}-heading`}>
					<SectionToggle
						controls={`${id}-tasks`}
						isOpen={isOpen}
						onToggle={() => {
							closeEditCard()
							onToggle()
						}}
					>
						{heading}
					</SectionToggle>
				</h2>

				{action}
			</div>

			{isOpen && <div id={`${id}-tasks`}>{children}</div>}
		</section>
	)
}
