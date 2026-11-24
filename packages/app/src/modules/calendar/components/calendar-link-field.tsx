import { buttonVariants } from '@soonlane/ui/components/button'
import { CopyField } from '@soonlane/ui/components/copy-field'

interface CalendarLinkFieldProps {
	url: string
}

/** The new link, shown once. `ph-no-capture` keeps it and the `webcal:` address out of session replay. */
export function CalendarLinkField({ url }: Readonly<CalendarLinkFieldProps>) {
	return (
		<div className="ph-no-capture flex flex-col gap-3">
			<CopyField
				blockedNote="Copying is blocked here. Select the link and copy it."
				label="Calendar link"
				value={url}
			/>

			<a
				className={buttonVariants()}
				href={url.replace(/^https?:/u, 'webcal:')}
			>
				Subscribe in Calendar
			</a>
		</div>
	)
}
