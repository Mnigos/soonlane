import type { RepeatInput } from '@soonlane/contracts'
import { REPEAT_INTERVAL_MAX, type RepeatUnit } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import { Button } from '@soonlane/ui/components/button'
import { type KeyboardEvent, useState } from 'react'

interface RepeatCustomFormProps {
	initial: RepeatInput | undefined
	onSave: (repeat: RepeatInput) => void
	onCancel: () => void
}

const CUSTOM_UNIT_LABELS = {
	day: 'days',
	week: 'weeks',
	month: 'months',
} as const satisfies Partial<Record<RepeatUnit, string>>

type CustomUnit = keyof typeof CUSTOM_UNIT_LABELS

const FIELD_CLASS =
	'h-8 rounded-md border bg-popover px-2 text-label text-foreground [color-scheme:dark] outline-none focus-visible:border-border-strong'

function isCustomUnit(unit: string): unit is CustomUnit {
	return Object.hasOwn(CUSTOM_UNIT_LABELS, unit)
}

function focusElement(input: HTMLInputElement | null) {
	input?.focus()
}

/** "Every [N] [days|weeks|months]"; not a <form>, since it renders inside the composer's. */
export function RepeatCustomForm({
	initial,
	onSave,
	onCancel,
}: Readonly<RepeatCustomFormProps>) {
	const [count, setCount] = useState(String(initial?.interval ?? 1))
	const [unit, setUnit] = useState<CustomUnit>(
		initial && isCustomUnit(initial.unit) ? initial.unit : 'day'
	)
	const interval = Number(count)
	const isValid =
		Number.isInteger(interval) &&
		interval >= 1 &&
		interval <= REPEAT_INTERVAL_MAX

	function save() {
		if (isValid) onSave({ unit, interval })
	}

	function saveOnEnter(event: KeyboardEvent<HTMLElement>) {
		if (event.key !== 'Enter') return

		event.preventDefault()
		save()
	}

	return (
		<fieldset aria-label="Custom repeat" className="flex flex-col gap-2">
			<div className="flex items-center gap-2 text-label text-secondary-foreground">
				Every
				<input
					aria-invalid={!isValid}
					aria-label="Repeat every"
					className={cn(FIELD_CLASS, 'w-14')}
					max={REPEAT_INTERVAL_MAX}
					min={1}
					onChange={event => setCount(event.target.value)}
					onKeyDown={saveOnEnter}
					ref={focusElement}
					type="number"
					value={count}
				/>
				<select
					aria-label="Repeat unit"
					className={cn(FIELD_CLASS, 'min-w-0 flex-1')}
					onChange={event => {
						if (isCustomUnit(event.target.value)) setUnit(event.target.value)
					}}
					onKeyDown={saveOnEnter}
					value={unit}
				>
					{Object.entries(CUSTOM_UNIT_LABELS).map(([value, label]) => (
						<option key={value} value={value}>
							{label}
						</option>
					))}
				</select>
			</div>

			<div className="flex justify-end gap-2">
				<Button onClick={onCancel} size="sm" variant="ghost">
					Cancel
				</Button>

				<Button aria-disabled={!isValid} onClick={save} size="sm">
					Save
				</Button>
			</div>
		</fieldset>
	)
}
