import type { FrontendScope, ImportRestriction } from './oxlint.conventions.mts'

const DESKTOP_SRC = 'apps/desktop/src'

const DESKTOP_PAGE_MESSAGE =
	'The desktop page runs in the webview: it reaches the main process only over RPC, and imports the RPC contract only as a type (ADR 0019).'

/** The page and the main process share one package.json, so these imports resolve from the page; the Vite build guard checks the same on resolved paths. */
const DESKTOP_PAGE_IMPORTS = {
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
		{
			regex: String.raw`^(\./|(\.\./)+)main(\.ts)?$`,
			message: DESKTOP_PAGE_MESSAGE,
		},
		{
			regex: String.raw`(^|/)(domain|application|infrastructure)/`,
			message: DESKTOP_PAGE_MESSAGE,
		},
		{
			regex: String.raw`(^|/)platform/(app\.|config/|electrobun/|macos/)`,
			message: DESKTOP_PAGE_MESSAGE,
		},
		{
			regex: String.raw`(^|/)page-rpc\.types(\.ts)?$`,
			allowTypeImports: true,
			message: DESKTOP_PAGE_MESSAGE,
		},
	],
} as const satisfies ImportRestriction

/** The bundled page: its entry, router, build-time env types, routes, every module's `presentation/` layer and the two RPC clients (ADR 0019). */
export const DESKTOP_PAGE_SCOPE = {
	workspace: 'apps/desktop',
	folders: [`${DESKTOP_SRC}/routes`, `${DESKTOP_SRC}/modules/*/presentation`],
	files: [
		`${DESKTOP_SRC}/view.tsx`,
		`${DESKTOP_SRC}/router.tsx`,
		`${DESKTOP_SRC}/build-info.types.ts`,
		`${DESKTOP_SRC}/platform/rpc/*.client.ts`,
	],
	imports: [DESKTOP_PAGE_IMPORTS],
	router: `${DESKTOP_SRC}/router.tsx`,
} satisfies FrontendScope

const DESKTOP_MAIN_MESSAGE =
	'The desktop main process renders nothing: React, the UI packages and page files stay in the page (ADR 0019).'

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
		{
			regex: String.raw`(^|/)(presentation|routes)/`,
			message: DESKTOP_MAIN_MESSAGE,
		},
		{
			regex: String.raw`(^(\./|(\.\./)+)(view|router)|\.client)(\.tsx?)?$`,
			message: DESKTOP_MAIN_MESSAGE,
		},
		{
			group: ['@soonlane/app/**', '!@soonlane/app/app-paths'],
			allowTypeImports: true,
			message: DESKTOP_MAIN_MESSAGE,
		},
	],
} as const satisfies ImportRestriction

/** Main-process sources of the desktop app, as `tsconfig.main.json` lists them. */
export const DESKTOP_MAIN_FILES = [
	`${DESKTOP_SRC}/main.ts`,
	`${DESKTOP_SRC}/platform/*.ts`,
	`${DESKTOP_SRC}/platform/config/**`,
	`${DESKTOP_SRC}/platform/electrobun/**`,
	`${DESKTOP_SRC}/platform/macos/**`,
	`${DESKTOP_SRC}/platform/rpc/page-rpc.types.ts`,
	`${DESKTOP_SRC}/modules/*/domain/**`,
	`${DESKTOP_SRC}/modules/*/application/**`,
	`${DESKTOP_SRC}/modules/*/infrastructure/**`,
] as const
