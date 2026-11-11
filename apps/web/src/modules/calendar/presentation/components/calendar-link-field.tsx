import { Button, buttonVariants } from '@soonlane/ui/components/button'
import { Check, Copy } from 'lucide-react'
import { useId, useState } from 'react'

const COPIED_FEEDBACK_MS = 2000

interface CalendarLinkFieldProps {
	url: string
}

/** The new link, shown once. `ph-no-capture` keeps it and the `webcal:` address out of session replay. */
export function CalendarLinkField({ url }: Readonly<CalendarLinkFieldProps>) {
	const fieldId = useId()
	const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>(
		'idle'
	)

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(url)
			setCopyState('copied')
			setTimeout(() => setCopyState('idle'), COPIED_FEEDBACK_MS)
		} catch {
			setCopyState('failed')
		}
	}

	return (
		<div className="ph-no-capture flex flex-col gap-3">
			<div className="flex flex-col gap-1.5">
				<label className="text-label font-medium" htmlFor={fieldId}>
					Calendar link
				</label>

				<div className="flex gap-2">
					<input
						className="h-9 min-w-0 flex-1 rounded-md border border-border-strong bg-background px-2 text-sm text-secondary-foreground outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						id={fieldId}
						onFocus={event => event.currentTarget.select()}
						readOnly
						value={url}
					/>

					<Button onClick={() => void copyLink()} variant="outline">
						{copyState === 'copied' ? (
							<Check aria-hidden />
						) : (
							<Copy aria-hidden />
						)}
						{copyState === 'copied' ? 'Copied' : 'Copy'}
					</Button>
				</div>

				<p aria-live="polite" className="text-caption text-muted-foreground">
					{copyState === 'failed' &&
						'Copying is blocked here. Select the link and copy it.'}
				</p>
			</div>

			<a
				className={buttonVariants()}
				href={url.replace(/^https?:/u, 'webcal:')}
			>
				Subscribe in Calendar
			</a>
		</div>
	)
}
