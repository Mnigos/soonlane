import type { Task } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Check } from 'lucide-react'
import { useId } from 'react'
import { PRIORITY_CIRCLE_CLASSES } from '../../helpers/task-priority.constants'

interface CompleteTaskButtonProps {
	task: Pick<Task, 'priority'>
	/** The element holding the title, so the button reads "Complete <title>" without the title in an attribute, which replay masking would not hide. */
	titleId: string
	onClick: () => void
	className?: string
}

/** The priority-colored circle before a task's title; a check shows on hover. */
export function CompleteTaskButton({
	task,
	titleId,
	onClick,
	className,
}: Readonly<CompleteTaskButtonProps>) {
	const buttonId = useId()

	return (
		<button
			aria-label="Complete"
			aria-labelledby={`${buttonId} ${titleId}`}
			className={cn(
				'group mt-0.5 flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors',
				PRIORITY_CIRCLE_CLASSES[task.priority],
				className
			)}
			id={buttonId}
			onClick={onClick}
			type="button"
		>
			<Check
				aria-hidden
				className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
				strokeWidth={3}
			/>
		</button>
	)
}
