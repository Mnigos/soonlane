import { Button } from '@soonlane/ui/components/button'
import { Dialog } from '@soonlane/ui/components/dialog'
import { Switch } from '@soonlane/ui/components/switch'
import { useState } from 'react'
import { CONSENT_COPY } from '../consent-copy.constants'
import { useConsent } from '../hooks/use-consent'

const ANALYTICS_LABEL_ID = 'privacy-choices-analytics'
const ANALYTICS_DESCRIPTION_ID = 'privacy-choices-analytics-description'

interface PrivacyChoicesDialogProps {
	onClose: () => void
}

export function PrivacyChoicesDialog({
	onClose,
}: Readonly<PrivacyChoicesDialogProps>) {
	const { consent, choose } = useConsent()
	const [isGranted, setIsGranted] = useState(consent === 'granted')

	return (
		<Dialog
			className="max-w-md p-5"
			label={CONSENT_COPY.dialogTitle}
			onClose={onClose}
		>
			<h2 className="text-base font-semibold">{CONSENT_COPY.dialogTitle}</h2>

			<div className="mt-3 flex flex-col divide-y">
				<div className="flex flex-col gap-1 py-3">
					<div className="flex items-center justify-between gap-4">
						<h3 className="text-sm font-semibold">
							{CONSENT_COPY.essentialLabel}
						</h3>

						<span className="text-label text-muted-foreground">
							{CONSENT_COPY.essentialStatus}
						</span>
					</div>

					<p className="text-label text-muted-foreground">
						{CONSENT_COPY.essentialDescription}
					</p>
				</div>

				<div className="flex flex-col gap-1 py-3">
					<div className="flex items-center justify-between gap-4">
						<h3 className="text-sm font-semibold" id={ANALYTICS_LABEL_ID}>
							{CONSENT_COPY.analyticsLabel}
						</h3>

						<Switch
							aria-describedby={ANALYTICS_DESCRIPTION_ID}
							aria-labelledby={ANALYTICS_LABEL_ID}
							checked={isGranted}
							onCheckedChange={setIsGranted}
						/>
					</div>

					<p
						className="text-label text-muted-foreground"
						id={ANALYTICS_DESCRIPTION_ID}
					>
						{CONSENT_COPY.analyticsDescription}
					</p>
				</div>
			</div>

			<div className="mt-2 flex justify-end">
				<Button
					onClick={() => choose(isGranted ? 'granted' : 'denied', 'settings')}
				>
					{CONSENT_COPY.save}
				</Button>
			</div>
		</Dialog>
	)
}
