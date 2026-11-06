import { TASK_PRIORITIES, type TaskPriority } from '@soonlist/domain'
import { cn } from '@soonlist/ui/cn'
import {
	Menu,
	MenuContent,
	MenuRadioGroup,
	MenuRadioItem,
	MenuTrigger,
} from '@soonlist/ui/components/menu'
import { Flag } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { COMPOSER_CHIP_CLASS } from '../../helpers/composer-chip.constants'
import { PRIORITY_FLAG_CLASSES } from '../../helpers/task-priority.constants'

interface PriorityChipProps {
	value: TaskPriority
	onChange: (priority: TaskPriority) => void
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

function PriorityFlag({ priority }: Readonly<{ priority: TaskPriority }>) {
	return (
		<Flag
			aria-hidden
			className={PRIORITY_FLAG_CLASSES[priority]}
			fill={priority === 4 ? 'none' : 'currentColor'}
		/>
	)
}

/** "Priority" until one is picked, then "P1" to "P3" with the colored flag, like Todoist. */
export function PriorityChip({
	value,
	onChange,
	onKeyDown,
}: Readonly<PriorityChipProps>) {
	const isDefault = value === 4

	return (
		<Menu>
			<MenuTrigger
				aria-label={`Priority ${value}`}
				className={cn(COMPOSER_CHIP_CLASS, !isDefault && 'text-foreground')}
				onKeyDown={onKeyDown}
			>
				{isDefault ? <Flag aria-hidden /> : <PriorityFlag priority={value} />}

				{isDefault ? 'Priority' : `P${value}`}
			</MenuTrigger>

			<MenuContent>
				<MenuRadioGroup
					onValueChange={(priority: TaskPriority) => onChange(priority)}
					value={value}
				>
					{TASK_PRIORITIES.map(priority => (
						<MenuRadioItem key={priority} value={priority}>
							<PriorityFlag priority={priority} />
							Priority {priority}
						</MenuRadioItem>
					))}
				</MenuRadioGroup>
			</MenuContent>
		</Menu>
	)
}
