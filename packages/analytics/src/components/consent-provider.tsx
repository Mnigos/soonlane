import { type PropsWithChildren, useState } from 'react'
import { applyConsent } from '../analytics.client'
import { saveConsent } from '../consent-cookie.helper'
import { ConsentContext } from '../consent.context'
import type { ConsentChoice, ConsentSource } from '../consent.types'
import { useStoredConsent } from '../hooks/use-stored-consent'
import { ConsentBanner } from './consent-banner'
import { PrivacyChoicesDialog } from './privacy-choices-dialog'

interface ConsentProviderProps extends PropsWithChildren {
	/** Whether analytics can run at all (a PostHog key is set); without it there is nothing to choose. */
	isAnalyticsEnabled: boolean
}

/**
 * Holds the visitor's consent and renders the banner and the privacy choices dialog. The banner
 * never ships in server HTML: it appears after hydration, and only when no choice is stored.
 */
export function ConsentProvider({
	isAnalyticsEnabled,
	children,
}: Readonly<ConsentProviderProps>) {
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
			value={{
				consent,
				isAnalyticsEnabled,
				choose,
				openChoices: () => setIsChoosing(true),
			}}
		>
			{children}

			{isAnalyticsEnabled && consent === 'unanswered' && <ConsentBanner />}

			{isChoosing && (
				<PrivacyChoicesDialog onClose={() => setIsChoosing(false)} />
			)}
		</ConsentContext>
	)
}
