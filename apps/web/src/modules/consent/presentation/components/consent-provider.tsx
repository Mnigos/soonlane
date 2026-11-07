import { type PropsWithChildren, useState } from 'react'
import { IS_ANALYTICS_ENABLED } from '@/modules/analytics/domain/analytics.constants'
import { applyConsent } from '@/modules/analytics/presentation/analytics.client'
import type {
	ConsentChoice,
	ConsentSource,
	ConsentState,
} from '../../domain/consent.types'
import { ConsentContext } from '../consent.context'
import { saveConsent } from '../helpers/consent-cookie.helper'
import { ConsentBanner } from './consent-banner'
import { PrivacyChoicesDialog } from './privacy-choices-dialog'

interface ConsentProviderProps extends PropsWithChildren {
	initialConsent: ConsentState
}

export function ConsentProvider({
	initialConsent,
	children,
}: Readonly<ConsentProviderProps>) {
	const [consent, setConsent] = useState(initialConsent)
	const [isChoosing, setIsChoosing] = useState(false)

	function choose(choice: ConsentChoice, source: ConsentSource) {
		setConsent(choice)
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
