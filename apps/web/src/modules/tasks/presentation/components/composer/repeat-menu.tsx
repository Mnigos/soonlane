import type { RepeatInput } from '@soonlane/contracts'
import type { CalendarDate, RepeatUnit } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Button } from '@soonlane/ui/components/button'
import {
	Menu,
	MenuContent,
	MenuRadioGroup,
	MenuRadioItem,
	MenuTrigger,
} from '@soonlane/ui/components/menu'
import { X } from 'lucide-react'
import { useState } from 'react'
import {
	formatRepeatRule,
	type RepeatRule,
} from '../../../domain/repeat-rule.helper'
import { FOOTER_BUTTON_CLASS } from '../../helpers/composer-chip.constants'
import { RepeatIcon } from './date-picker-icons'
import { RepeatCustomForm } from './repeat-custom-form'

interface RepeatMenuProps {
	dueDate: CalendarDate
	value: RepeatRule | undefined
	onChange: (repeat: RepeatInput | undefined) => void
}

const PRESET_UNITS = [
	'day',
	'week',
	'weekday',
	'month',
	'year',
] as const satisfies readonly RepeatUnit[]
const CUSTOM = 'custom'

export function RepeatMenu({
	dueDate,
	value,
	onChange,
}: Readonly<RepeatMenuProps>) {
	const [isCustom, setIsCustom] = useState(false)

	if (isCustom)
		return (
			<RepeatCustomForm
				initial={value}
				onCancel={() => setIsCustom(false)}
				onSave={repeat => {
					onChange(repeat)
					setIsCustom(false)
				}}
			/>
		)

	return (
		<div className="flex gap-1">
			<Menu>
				<MenuTrigger
					className={cn(
						FOOTER_BUTTON_CLASS,
						'h-auto min-h-8 min-w-0 px-2 py-1.5',
						value && 'text-foreground'
					)}
				>
					<RepeatIcon strokeWidth={1.5} />

					<span className="line-clamp-2 text-left">
						{value ? formatRepeatRule(value) : 'Repeat'}
					</span>
				</MenuTrigger>

				<MenuContent side="top">
					<MenuRadioGroup
						onValueChange={(choice: RepeatUnit | typeof CUSTOM) => {
							if (choice === CUSTOM) setIsCustom(true)
							else onChange({ unit: choice, interval: 1 })
						}}
						value={value?.interval === 1 ? value.unit : null}
					>
						{PRESET_UNITS.map(unit => (
							<MenuRadioItem key={unit} value={unit}>
								{formatRepeatRule({
									unit,
									interval: 1,
									anchor:
										value?.unit === unit && value.interval === 1
											? value.anchor
											: dueDate,
								})}
							</MenuRadioItem>
						))}

						<MenuRadioItem value={CUSTOM}>Custom...</MenuRadioItem>
					</MenuRadioGroup>
				</MenuContent>
			</Menu>

			{value && (
				<Button
					aria-label="Clear repeat"
					className="shrink-0"
					onClick={() => onChange(undefined)}
					size="icon"
					variant="ghost"
				>
					<X aria-hidden />
				</Button>
			)}
		</div>
	)
}
