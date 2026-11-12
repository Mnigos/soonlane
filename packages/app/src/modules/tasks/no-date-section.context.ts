import { createContext } from 'react'

/** The No date section's collapse, shared by Upcoming, Today and the label views and remembered on the device. */
export interface NoDateSectionContextValue {
	isOpen: boolean
	toggle: () => void
}

export const NoDateSectionContext =
	createContext<NoDateSectionContextValue | null>(null)
