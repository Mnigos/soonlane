import { PriorityFlagIcon } from '@soonlane/app/tasks/components/composer/priority-flag-icon'
import { PRIORITY_FLAG_CLASSES } from '@soonlane/app/tasks/helpers/task-priority.constants'
import { TASK_PRIORITIES, type TaskPriority } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	MenuGroup,
	MenuGroupLabel,
	MenuIconRadioItem,
	MenuRadioGroup,
	MenuRow,
} from '@soonlane/ui/components/menu'
import { Tooltip } from '@soonlane/ui/components/tooltip'

interface TaskMenuPriorityGroupProps {
	value: TaskPriority
	onChange: (priority: TaskPriority) => void
}

/** Todoist's "Priority" row: four flags, the task's own one framed. */
export function TaskMenuPriorityGroup({
	value,
	onChange,
}: Readonly<TaskMenuPriorityGroupProps>) {
	return (
		<MenuGroup>
			<MenuGroupLabel>Priority</MenuGroupLabel>

			<MenuRadioGroup
				onValueChange={(priority: TaskPriority) => onChange(priority)}
				value={value}
			>
				<MenuRow>
					{TASK_PRIORITIES.map(priority => (
						<Tooltip key={priority} label={`Priority ${priority}`} sharesEscape>
							<MenuIconRadioItem
								aria-label={`Priority ${priority}`}
								label={`Priority ${priority}`}
								value={priority}
							>
								<PriorityFlagIcon
									className={cn('size-5.5', PRIORITY_FLAG_CLASSES[priority])}
									isFilled={priority !== 4}
									strokeWidth={0.75}
								/>
							</MenuIconRadioItem>
						</Tooltip>
					))}
				</MenuRow>
			</MenuRadioGroup>
		</MenuGroup>
	)
}
