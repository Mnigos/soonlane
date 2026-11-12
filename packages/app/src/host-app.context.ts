import { createContext, type ReactNode } from 'react'
import type { APP_PATHS } from './app-path.constants'

/** What only the host app knows; it renders `HostAppContext` around the package's screens. */
export interface HostApp {
	/** The sidebar's user menu, with the sign-out and account actions the host runs. */
	renderUserMenu: (onShowShortcuts: () => void) => ReactNode
	/** Where a screen sends the user when the view it shows is gone, such as a deleted label: the web app's landing page or Upcoming. */
	homePath: '/' | typeof APP_PATHS.upcoming
	appVersion: string
	appCommit: string
	/** This build's release notes on the public site. */
	releaseNotesUrl: string
}

export const HostAppContext = createContext<HostApp | null>(null)
