import { TASK_PRIORITIES, type TaskPriority } from '@soonlist/domain'
import { cn } from '@soonlist/ui/cn'
import { Flag } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { PRIORITY_FLAG_CLASSES } from '../../helpers/task-priority.constants'

interface PriorityPickerProps {
	value: TaskPriority
	onChange: (priority: TaskPriority) => void
	onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
}

export function PriorityPicker({
	value,
	onChange,
	onKeyDown,
}: Readonly<PriorityPickerProps>) {
	return (
		<fieldset className="inline-flex items-center gap-0.5 rounded-md border p-0.5">
			<legend className="sr-only">Priority</legend>

			{TASK_PRIORITIES.map(priority => (
				<label
					className={cn(
						'flex h-7 cursor-pointer items-center gap-1 rounded-sm px-1.5 text-caption text-muted-foreground transition-colors hover:bg-hover has-focus-visible:outline-2 has-focus-visible:outline-primary',
						priority === value && 'bg-hover text-foreground'
					)}
					key={priority}
					title={`Priority ${priority}`}
				>
					<input
						checked={priority === value}
						className="sr-only"
						name="priority"
						onChange={() => onChange(priority)}
						onKeyDown={onKeyDown}
						type="radio"
						value={priority}
					/>
					<Flag
						aria-hidden
						className={cn('size-3.5', PRIORITY_FLAG_CLASSES[priority])}
						fill={priority === 4 ? 'none' : 'currentColor'}
					/>
					P{priority}
				</label>
			))}
		</fieldset>
	)
}
