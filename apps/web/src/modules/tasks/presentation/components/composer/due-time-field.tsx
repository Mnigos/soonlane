import { Button } from '@soonlane/ui/components/button'
import { Clock, X } from 'lucide-react'
import { useState } from 'react'
import { FOOTER_BUTTON_CLASS } from '../../helpers/composer-chip.constants'

interface DueTimeFieldProps {
	value: string | undefined
	onChange: (time: string | undefined) => void
}

function focusElement(input: HTMLInputElement | null) {
	input?.focus()
}

export function DueTimeField({ value, onChange }: Readonly<DueTimeFieldProps>) {
	const [isOpen, setIsOpen] = useState(value !== undefined)
	const [shouldFocus, setShouldFocus] = useState(false)

	if (!isOpen)
		return (
			<button
				className={FOOTER_BUTTON_CLASS}
				onClick={() => {
					setIsOpen(true)
					setShouldFocus(true)
				}}
				type="button"
			>
				<Clock aria-hidden strokeWidth={1.5} />
				Time
			</button>
		)

	return (
		<div className="flex h-8 items-center gap-2 rounded-md border pr-0.5 pl-3">
			<input
				aria-label="Due time"
				className="min-w-0 flex-1 bg-transparent text-label text-foreground [color-scheme:dark] outline-none"
				onChange={event => onChange(event.target.value || undefined)}
				ref={shouldFocus ? focusElement : undefined}
				type="time"
				value={value ?? ''}
			/>

			<Button
				aria-label="Clear time"
				className="size-7"
				onClick={() => {
					onChange(undefined)
					setIsOpen(false)
				}}
				size="icon"
				variant="ghost"
			>
				<X aria-hidden />
			</Button>
		</div>
	)
}
