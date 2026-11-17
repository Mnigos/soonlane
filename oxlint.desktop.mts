import type { ImportRestriction } from './oxlint.conventions.mts'

/** The desktop app's bundled page; the rest of `apps/desktop/src` is the main process. */
export const DESKTOP_PAGE = 'apps/desktop/src/view'

const DESKTOP_PAGE_MESSAGE =
	'The desktop page runs in the webview: it reaches the main process only over RPC, and imports the RPC contract only as a type.'

/** The page and the main process share one package.json, so these imports resolve from the page; the Vite build guard checks the same on resolved paths. */
export const DESKTOP_PAGE_IMPORTS = {
	paths: [
		{ name: 'electrobun', message: DESKTOP_PAGE_MESSAGE },
		{ name: 'bun', message: DESKTOP_PAGE_MESSAGE },
	],
	patterns: [
		{ regex: String.raw`^(effect|@effect/)`, message: DESKTOP_PAGE_MESSAGE },
		{ regex: String.raw`^(bun:|node:)`, message: DESKTOP_PAGE_MESSAGE },
		{
			regex: String.raw`^electrobun/(main|bun|rpc)(/|$)`,
			message: DESKTOP_PAGE_MESSAGE,
		},
		{ regex: String.raw`^(\.\./)+main(\.ts)?$`, message: DESKTOP_PAGE_MESSAGE },
		{
			regex: String.raw`(^|/)(domain|application|infrastructure)/`,
			message: DESKTOP_PAGE_MESSAGE,
		},
		{
			regex: String.raw`(^|/)platform/(app\.|config/|macos/)`,
			message: DESKTOP_PAGE_MESSAGE,
		},
		{
			regex: String.raw`(^|/)platform/electrobun/`,
			allowTypeImports: true,
			message: DESKTOP_PAGE_MESSAGE,
		},
	],
} as const satisfies ImportRestriction

const DESKTOP_MAIN_MESSAGE =
	'The desktop main process renders nothing: React, the UI packages and page files stay in the page.'

/** The main process keeps `@soonlane/app/app-paths` and the `DesktopHostMessage` type; everything else in `@soonlane/app` is page code. */
export const DESKTOP_MAIN_IMPORTS = {
	patterns: [
		{
			regex: String.raw`^(react|react-dom|sonner|lucide-react)(/|$)`,
			message: DESKTOP_MAIN_MESSAGE,
		},
		{
			regex: String.raw`^(@tanstack/react-|@soonlane/ui(/|$))`,
			message: DESKTOP_MAIN_MESSAGE,
		},
		{
			regex: String.raw`^electrobun/(view|browser/)`,
			message: DESKTOP_MAIN_MESSAGE,
		},
		{ regex: String.raw`(^|/)view/`, message: DESKTOP_MAIN_MESSAGE },
		{
			group: ['@soonlane/app/**', '!@soonlane/app/app-paths'],
			allowTypeImports: true,
			message: DESKTOP_MAIN_MESSAGE,
		},
	],
} as const satisfies ImportRestriction

/** Main-process sources of the desktop app; everything else under `src` is the page. */
export const DESKTOP_MAIN_FILES = [
	'apps/desktop/src/main.ts',
	'apps/desktop/src/platform/**',
	'apps/desktop/src/modules/**',
] as const
