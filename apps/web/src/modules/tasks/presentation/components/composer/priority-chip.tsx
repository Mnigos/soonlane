import { TASK_PRIORITIES, type TaskPriority } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	Menu,
	MenuContent,
	MenuRadioGroup,
	MenuRadioItem,
	MenuTrigger,
} from '@soonlane/ui/components/menu'
import type { KeyboardEvent } from 'react'
import { COMPOSER_CHIP_CLASS } from '../../helpers/composer-chip.constants'
import { PRIORITY_FLAG_CLASSES } from '../../helpers/task-priority.constants'
import { PriorityFlagIcon } from './priority-flag-icon'

interface PriorityChipProps {
	value: TaskPriority
	onChange: (priority: TaskPriority) => void
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
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
				<PriorityFlagIcon
					className={isDefault ? undefined : PRIORITY_FLAG_CLASSES[value]}
					isFilled={!isDefault}
				/>

				{isDefault ? 'Priority' : `P${value}`}
			</MenuTrigger>

			<MenuContent>
				<MenuRadioGroup
					onValueChange={(priority: TaskPriority) => onChange(priority)}
					value={value}
				>
					{TASK_PRIORITIES.map(priority => (
						<MenuRadioItem key={priority} value={priority}>
							<PriorityFlagIcon
								className={cn('size-5.5', PRIORITY_FLAG_CLASSES[priority])}
								isFilled={priority !== 4}
								strokeWidth={0.75}
							/>
							Priority {priority}
						</MenuRadioItem>
					))}
				</MenuRadioGroup>
			</MenuContent>
		</Menu>
	)
}
