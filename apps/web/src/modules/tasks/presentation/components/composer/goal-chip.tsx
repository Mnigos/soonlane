import type { CreateTaskInput } from '@soonlane/contracts'
import { GOAL_TARGET_MAX, GOAL_UNIT_MAX_LENGTH } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@soonlane/ui/components/popover'
import { Target } from 'lucide-react'
import { type KeyboardEvent, type Ref, useId, useRef, useState } from 'react'
import {
	CHIP_ICON_STROKE,
	COMPOSER_CHIP_CLASS,
	FOOTER_BUTTON_CLASS,
} from '../../helpers/composer-chip.constants'
import { GoalField } from '../task/goal-field'
import { ComingSoonButton } from './coming-soon-button'

type Goal = CreateTaskInput['goal']

interface GoalChipProps {
	value: Goal
	onChange: (goal: Goal) => void
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
	isReadOnly?: boolean
}

interface GoalFieldsProps {
	value: Goal
	onApply: (goal: Goal) => void
	targetRef: Ref<HTMLInputElement>
}

function GoalFields({ value, onApply, targetRef }: Readonly<GoalFieldsProps>) {
	const [target, setTarget] = useState(value ? String(value.target) : '')
	const [unit, setUnit] = useState(value?.unit ?? '')
	const amount = Number(target)
	const isValid =
		Number.isInteger(amount) && amount >= 1 && amount <= GOAL_TARGET_MAX

	function applyOnEnter(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== 'Enter') return

		event.preventDefault()
		if (isValid) onApply({ target: amount, unit: unit.trim() || undefined })
	}

	return (
		<div className="flex flex-col gap-3 p-3">
			<GoalField
				aria-invalid={target !== '' && !isValid}
				enterKeyHint="done"
				label="Target"
				max={GOAL_TARGET_MAX}
				min={1}
				onChange={event => setTarget(event.target.value)}
				onKeyDown={applyOnEnter}
				placeholder="50"
				ref={targetRef}
				step={1}
				type="number"
				value={target}
			/>

			<GoalField
				enterKeyHint="done"
				label="Unit"
				maxLength={GOAL_UNIT_MAX_LENGTH}
				onChange={event => setUnit(event.target.value)}
				onKeyDown={applyOnEnter}
				placeholder="push-ups"
				value={unit}
			/>

			{value && (
				<button
					className={FOOTER_BUTTON_CLASS}
					onClick={() => onApply(undefined)}
					type="button"
				>
					Remove goal
				</button>
			)}
		</div>
	)
}

export function GoalChip({
	value,
	onChange,
	onKeyDown,
	isReadOnly = false,
}: Readonly<GoalChipProps>) {
	const [isOpen, setIsOpen] = useState(false)
	const targetRef = useRef<HTMLInputElement>(null)
	const triggerId = useId()
	const labelId = useId()
	const label = value?.unit ? `${value.target} ${value.unit}` : value?.target
	// The unit is user content: it stays in masked text, and the name points at it instead of copying it.
	const labelledBy = label === undefined ? undefined : labelId
	const chip = (
		<>
			<Target aria-hidden strokeWidth={CHIP_ICON_STROKE} />

			{label === undefined ? (
				'Goal'
			) : (
				<span className="ph-mask" id={labelId}>
					{label}
				</span>
			)}
		</>
	)

	if (isReadOnly)
		return (
			<ComingSoonButton
				className={COMPOSER_CHIP_CLASS}
				label="Goal"
				labelledBy={labelledBy}
				onKeyDown={onKeyDown}
			>
				{chip}
			</ComingSoonButton>
		)

	return (
		<Popover onOpenChange={setIsOpen} open={isOpen}>
			<PopoverTrigger
				aria-label="Goal"
				aria-labelledby={labelledBy && `${triggerId} ${labelledBy}`}
				className={cn(COMPOSER_CHIP_CLASS, value && 'text-foreground')}
				id={triggerId}
				onKeyDown={onKeyDown}
			>
				{chip}
			</PopoverTrigger>

			<PopoverContent
				align="center"
				aria-label="Goal"
				className="w-56"
				initialFocus={targetRef}
				sideOffset={2}
			>
				<GoalFields
					onApply={goal => {
						onChange(goal)
						setIsOpen(false)
					}}
					targetRef={targetRef}
					value={value}
				/>
			</PopoverContent>
		</Popover>
	)
}
