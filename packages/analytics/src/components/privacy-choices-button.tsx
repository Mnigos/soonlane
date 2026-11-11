import type { PropsWithChildren } from 'react'
import { CONSENT_COPY } from '../consent-copy.constants'
import { useConsent } from '../hooks/use-consent'

interface PrivacyChoicesButtonProps extends PropsWithChildren {
	className?: string
}

/** Opens the Privacy choices dialog; there is nothing to choose without analytics. */
export function PrivacyChoicesButton({
	className,
	children = CONSENT_COPY.choicesLink,
}: Readonly<PrivacyChoicesButtonProps>) {
	const { isAnalyticsEnabled, openChoices } = useConsent()

	if (!isAnalyticsEnabled) return null

	return (
		<button className={className} onClick={openChoices} type="button">
			{children}
		</button>
	)
}
