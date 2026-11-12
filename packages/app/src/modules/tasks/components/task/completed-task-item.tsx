import type { Task } from '@soonlane/contracts'
import { Check } from 'lucide-react'
import { useId } from 'react'

interface CompletedTaskItemProps {
	task: Task
	isDisabled: boolean
	onReopen: () => void
}

export function CompletedTaskItem({
	task,
	isDisabled,
	onReopen,
}: Readonly<CompletedTaskItemProps>) {
	const buttonId = useId()
	const titleId = useId()

	// "Reopen <title>" without the title in an attribute, which replay masking would not hide.
	return (
		<li className="flex gap-2.5 border-b py-2.5">
			<button
				aria-label="Reopen"
				aria-labelledby={`${buttonId} ${titleId}`}
				className="mt-0.5 flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-faint-foreground bg-faint-foreground text-background transition-colors hover:bg-transparent hover:text-faint-foreground disabled:cursor-default disabled:bg-faint-foreground disabled:text-background"
				disabled={isDisabled}
				id={buttonId}
				onClick={onReopen}
				type="button"
			>
				<Check aria-hidden className="size-3" strokeWidth={3} />
			</button>

			<p
				className="ph-mask min-w-0 flex-1 text-sm text-muted-foreground line-through"
				id={titleId}
			>
				{task.title}
			</p>
		</li>
	)
}
