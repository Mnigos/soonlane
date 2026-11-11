import { createContext } from 'react'
import type {
	ConsentChoice,
	ConsentSource,
	ConsentState,
} from './consent.types'

export interface ConsentContextValue {
	/** `undefined` until the browser has read the consent cookie. */
	consent: ConsentState | undefined
	isAnalyticsEnabled: boolean
	choose: (choice: ConsentChoice, source: ConsentSource) => void
	openChoices: () => void
}

export const ConsentContext = createContext<ConsentContextValue | null>(null)
