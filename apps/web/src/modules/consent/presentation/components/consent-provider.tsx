import { type PropsWithChildren, useState } from 'react'
import { IS_ANALYTICS_ENABLED } from '@/modules/analytics/domain/analytics.constants'
import { applyConsent } from '@/modules/analytics/presentation/analytics.client'
import type { ConsentChoice, ConsentSource } from '../../domain/consent.types'
import { ConsentContext } from '../consent.context'
import { saveConsent } from '../helpers/consent-cookie.helper'
import { useStoredConsent } from '../hooks/use-stored-consent'
import { ConsentBanner } from './consent-banner'
import { PrivacyChoicesDialog } from './privacy-choices-dialog'

/**
 * Holds the visitor's consent and renders the banner and the privacy choices dialog. The banner
 * never ships in server HTML: it appears after hydration, and only when no choice is stored.
 */
export function ConsentProvider({ children }: Readonly<PropsWithChildren>) {
	const storedConsent = useStoredConsent()
	const [chosenConsent, setChosenConsent] = useState<ConsentChoice>()
	const [isChoosing, setIsChoosing] = useState(false)
	const consent = chosenConsent ?? storedConsent

	function choose(choice: ConsentChoice, source: ConsentSource) {
		setChosenConsent(choice)
		setIsChoosing(false)
		void saveConsent(choice)
		applyConsent(choice, source)
	}

	return (
		<ConsentContext
			value={{ consent, choose, openChoices: () => setIsChoosing(true) }}
		>
			{children}

			{IS_ANALYTICS_ENABLED && consent === 'unanswered' && <ConsentBanner />}

			{isChoosing && (
				<PrivacyChoicesDialog onClose={() => setIsChoosing(false)} />
			)}
		</ConsentContext>
	)
}
