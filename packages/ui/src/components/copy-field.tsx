import { Check, Copy } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from './button'

const COPIED_FEEDBACK_MS = 2000

interface CopyFieldProps {
	label: string
	value: string
	/** Shown when the browser refuses the clipboard, telling the user to select the value instead. */
	blockedNote: string
}

/** A labeled read-only value with a Copy button; focusing the field selects it, for when copying is blocked. */
export function CopyField({
	label,
	value,
	blockedNote,
}: Readonly<CopyFieldProps>) {
	const fieldId = useId()
	const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
		'idle'
	)

	async function copyValue() {
		try {
			await navigator.clipboard.writeText(value)
			setCopyState('copied')
			setTimeout(() => setCopyState('idle'), COPIED_FEEDBACK_MS)
		} catch {
			setCopyState('failed')
		}
	}

	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-label font-medium" htmlFor={fieldId}>
				{label}
			</label>

			<div className="flex gap-2">
				<input
					className="h-9 min-w-0 flex-1 rounded-md border border-border-strong bg-background px-2 text-sm text-secondary-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
					id={fieldId}
					onFocus={event => event.currentTarget.select()}
					readOnly
					value={value}
				/>

				<Button onClick={() => void copyValue()} variant="outline">
					{copyState === 'copied' ? (
						<Check aria-hidden />
					) : (
						<Copy aria-hidden />
					)}
					{copyState === 'copied' ? 'Copied' : 'Copy'}
				</Button>
			</div>

			<p aria-live="polite" className="text-caption text-muted-foreground">
				{copyState === 'failed' && blockedNote}
			</p>
		</div>
	)
}
