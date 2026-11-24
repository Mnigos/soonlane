import { createContext, type ReactNode } from 'react'

/** What only the host app knows; it renders `HostAppContext` around the package's screens. */
export interface HostApp {
	/** The sidebar's user menu, with the sign-out and account actions the host runs. */
	renderUserMenu: (onShowShortcuts: () => void) => ReactNode
	appVersion: string
	appCommit: string
	/** This build's release notes on the landing. */
	releaseNotesUrl: string
	/** The web page that links Linear; the desktop app passes its absolute URL, which opens in the system browser. */
	linearConnectHref: string
	/** A link into the Todoist import with the caller's classes; absent when this host offers no import. */
	renderTodoistImportLink?: (className: string) => ReactNode
}

export const HostAppContext = createContext<HostApp | null>(null)
