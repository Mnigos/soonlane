import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	Menu,
	MenuContent,
	MenuItem,
	MenuTrigger,
} from '@soonlane/ui/components/menu'
import { Tooltip } from '@soonlane/ui/components/tooltip'
import { Ellipsis, Trash2 } from 'lucide-react'
import { type KeyboardEvent, useState } from 'react'
import { CHIP_ICON_STROKE } from '../../helpers/composer-chip.constants'
import { keepFocusAfterMove } from '../../helpers/task-focus.helper'
import { DeleteTaskDialog } from './delete-task-dialog'

interface TaskActionsMenuProps {
	/** Absent while the composer adds a new task, which has nothing to delete. */
	task: Task | undefined
	today: CalendarDate
	className?: string
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/** The "…" menu on a task row and in its edit card, as in Todoist; Delete asks first. */
export function TaskActionsMenu({
	task,
	today,
	className,
	onKeyDown,
}: Readonly<TaskActionsMenuProps>) {
	const [isDeleting, setIsDeleting] = useState(false)

	if (!task) return null

	return (
		<>
			<Menu>
				<Tooltip label="More task actions">
					<MenuTrigger
						aria-label="More task actions"
						className={cn(
							'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary-foreground transition hover:bg-hover focus-visible:outline-2 focus-visible:outline-primary data-popup-open:bg-hover data-popup-open:opacity-100',
							className
						)}
						data-task-id={task.id}
						onKeyDown={onKeyDown}
						ref={keepFocusAfterMove}
					>
						<Ellipsis
							aria-hidden
							className="size-4.5"
							strokeWidth={CHIP_ICON_STROKE}
						/>
					</MenuTrigger>
				</Tooltip>

				<MenuContent align="end" className="w-40 py-1">
					<MenuItem className="text-danger" onClick={() => setIsDeleting(true)}>
						<Trash2 aria-hidden className="size-4" />
						Delete
					</MenuItem>
				</MenuContent>
			</Menu>

			{isDeleting && (
				<DeleteTaskDialog
					onClose={() => setIsDeleting(false)}
					task={task}
					today={today}
				/>
			)}
		</>
	)
}
