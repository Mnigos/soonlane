import type { CalendarDate } from '@soonlist/domain'
import { cn } from '@soonlist/ui/cn'
import { Calendar } from 'lucide-react'
import { getDueChipLabel } from '../../../domain/due-label.helper'
import { COMPOSER_CHIP_CLASS } from '../../helpers/composer-chip.constants'
import { DUE_TONE_CLASSES } from '../../helpers/due-tone.constants'

interface DueDateChipProps {
	dueDate: CalendarDate
	today: CalendarDate
}

/**
 * The day the new task is due, colored like the due line. A task always has a
 * due date in this version, so the chip has no clear button.
 */
export function DueDateChip({ dueDate, today }: Readonly<DueDateChipProps>) {
	const label = getDueChipLabel(dueDate, undefined, today)

	return (
		<span
			className={cn(
				COMPOSER_CHIP_CLASS,
				'cursor-default hover:bg-transparent',
				DUE_TONE_CLASSES[label.tone]
			)}
		>
			<Calendar aria-hidden />
			<span className="sr-only">Due </span>
			{label.text}
		</span>
	)
}
