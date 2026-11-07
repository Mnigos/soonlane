import { createContext } from 'react'
import type {
	ConsentChoice,
	ConsentSource,
	ConsentState,
} from '../domain/consent.types'

export interface ConsentContextValue {
	consent: ConsentState
	choose: (choice: ConsentChoice, source: ConsentSource) => void
	openChoices: () => void
}

export const ConsentContext = createContext<ConsentContextValue | null>(null)
