import type { Task } from '@soonlane/contracts'
import { type KeyboardEvent, useRef } from 'react'
import { PickerChip } from '../../tasks/components/composer/picker-chip'
import { LINEAR_COPY } from '../helpers/linear-copy.constants'
import { useLinearPinMutations } from '../hooks/use-linear-pin-mutations'
import { LinearIcon } from './linear-icon'
import { LinearIssuePicker } from './linear-issue-picker'

interface LinearChipProps {
	task: Task
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/** The edit card's "Linear" chip with the number of pinned issues; its picker pins and unpins at once, apart from the card's save. */
export function LinearChip({ task, onKeyDown }: Readonly<LinearChipProps>) {
	const inputRef = useRef<HTMLInputElement>(null)
	const mutations = useLinearPinMutations()

	return (
		<PickerChip
			count={task.linearPins.length}
			icon={<LinearIcon />}
			inputRef={inputRef}
			label={LINEAR_COPY.chipLabel}
			name={undefined}
			onKeyDown={onKeyDown}
			onOpenChange={() => mutations.pin.reset()}
			popoverClassName="w-80"
		>
			<LinearIssuePicker
				inputRef={inputRef}
				mutations={mutations}
				task={task}
			/>
		</PickerChip>
	)
}
