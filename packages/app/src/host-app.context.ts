import type { LinkProps } from '@tanstack/react-router'
import { createContext, type ReactNode } from 'react'

/** What only the host app knows; it renders `HostAppContext` around the package's screens. */
export interface HostApp {
	/** The sidebar's user menu, with the sign-out and account actions the host runs. */
	renderUserMenu: (onShowShortcuts: () => void) => ReactNode
	/** Where a screen sends the user when the view it shows is gone, such as a deleted label. */
	homePath: LinkProps['to']
	appVersion: string
	appCommit: string
	/** This build's release notes on the public site. */
	releaseNotesUrl: string
}

export const HostAppContext = createContext<HostApp | null>(null)
