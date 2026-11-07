import type { PropsWithChildren } from 'react'
import { IS_ANALYTICS_ENABLED } from '@/modules/analytics/domain/analytics.constants'
import { CONSENT_COPY } from '../consent-copy.constants'
import { useConsent } from '../hooks/use-consent'

interface PrivacyChoicesButtonProps extends PropsWithChildren {
	className?: string
}

export function PrivacyChoicesButton({
	className,
	children = CONSENT_COPY.choicesLink,
}: Readonly<PrivacyChoicesButtonProps>) {
	const { openChoices } = useConsent()

	if (!IS_ANALYTICS_ENABLED) return null

	return (
		<button className={className} onClick={openChoices} type="button">
			{children}
		</button>
	)
}
