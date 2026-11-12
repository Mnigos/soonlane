import { createContext } from 'react'

/** One collapse for the Inbox section (Upcoming, Today) and the No date section (label views), remembered on the device. */
export interface NoDateSectionContextValue {
	isOpen: boolean
	toggle: () => void
}

export const NoDateSectionContext =
	createContext<NoDateSectionContextValue | null>(null)
