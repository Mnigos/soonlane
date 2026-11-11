import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	Menu,
	MenuContent,
	MenuItem,
	MenuSeparator,
	MenuTrigger,
} from '@soonlane/ui/components/menu'
import { Tooltip } from '@soonlane/ui/components/tooltip'
import { Ellipsis, Trash2 } from 'lucide-react'
import {
	type KeyboardEvent,
	type PropsWithChildren,
	type RefObject,
	useCallback,
	useState,
} from 'react'
import { CHIP_ICON_STROKE } from '../../helpers/composer-chip.constants'
import { keepFocusAfterMove } from '../../helpers/task-focus.helper'
import { DeleteTaskDialog } from './delete-task-dialog'

interface TaskActionsMenuProps extends PropsWithChildren {
	/** Absent while the composer adds a new task, which has nothing to delete. */
	task: Task | undefined
	today: CalendarDate
	className?: string
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
	autoFocus?: boolean
	/** Filled with the "…" button, for a popover that opens from the menu. */
	triggerRef?: RefObject<HTMLButtonElement | null>
}

/**
 * The "…" menu on a task row and in its edit card, as in Todoist; Delete asks first.
 * Children (the row's Edit, Date and Priority) sit above Delete, set off by a separator.
 */
export function TaskActionsMenu({
	task,
	today,
	className,
	onKeyDown,
	children,
	autoFocus,
	triggerRef,
}: Readonly<TaskActionsMenuProps>) {
	const [isDeleting, setIsDeleting] = useState(false)
	const attachTrigger = useCallback(
		(button: HTMLButtonElement) => {
			if (triggerRef) triggerRef.current = button
			const keepFocus = keepFocusAfterMove(button)

			return () => {
				keepFocus()
				if (triggerRef) triggerRef.current = null
			}
		},
		[triggerRef]
	)

	if (!task) return null

	return (
		<>
			<Menu>
				<Tooltip label="More task actions">
					<MenuTrigger
						aria-label="More task actions"
						autoFocus={autoFocus}
						className={cn(
							'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary-foreground transition hover:bg-hover focus-visible:outline-2 focus-visible:outline-primary data-popup-open:bg-hover data-popup-open:opacity-100',
							className
						)}
						data-task-id={task.id}
						onKeyDown={onKeyDown}
						ref={attachTrigger}
					>
						<Ellipsis
							aria-hidden
							className="size-4.5"
							strokeWidth={CHIP_ICON_STROKE}
						/>
					</MenuTrigger>
				</Tooltip>

				<MenuContent
					align="end"
					className={cn('py-1', children ? 'w-56' : 'w-40')}
				>
					{children && (
						<>
							{children}

							<MenuSeparator />
						</>
					)}

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
