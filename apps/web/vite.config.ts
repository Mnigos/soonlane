import { readBuildInfo } from '@soonlane/vite-config/build-info'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import { routes } from './src/routes'

const { environment, define } = readBuildInfo(new URL('.', import.meta.url))

/**
 * Without the API's origin or the cookie prefix, deployed pages call no API and look signed out, and without the landing's origin the links to the public pages go nowhere, so only development may fall back.
 * `VITE_API_URL` may be set empty: the browser then calls the API on the page's own origin, as the self-hosted image does behind its proxy.
 */
const REQUIRED_VARIABLES = [
	'VITE_API_URL',
	'VITE_AUTH_COOKIE_PREFIX',
	'VITE_LANDING_URL',
] as const

function isMissing(name: (typeof REQUIRED_VARIABLES)[number]) {
	return name === 'VITE_API_URL'
		? process.env[name] === undefined
		: !process.env[name]
}

for (const name of REQUIRED_VARIABLES)
	if (environment !== 'development' && isMissing(name))
		throw new Error(
			`${name} is not set; ${environment} builds need it (docs/deploy-railway.md)`
		)

/** A custom list replaces TanStack Start's default client deny list, so it repeats the default's `*.server.*` pattern. */
const SERVER_ONLY_FILES = [
	'**/*.server.*',
	'**/platform/**',
	'**/infrastructure/**',
	'**/*.handler.ts',
	'**/routes/api.*',
]

/** The custom list replaces the default, so it repeats '@tanstack/react-start/server'. The app depends on @soonlane/auth for its browser client, so the package's server entry is denied here; soonlane/no-api-only-import keeps it, the database and its drivers out of apps/web altogether. */
const SERVER_ONLY_SPECIFIERS = [
	'@tanstack/react-start/server',
	'@soonlane/auth/server',
]

/** The browser half of the oRPC client lives in platform/rpc next to the server half; these files are the only platform code the client may import. The custom list replaces the default, so it repeats node_modules. */
const BROWSER_SAFE_PLATFORM_FILES = [
	'**/node_modules/**',
	'**/platform/rpc/rpc.client.ts',
	'**/platform/rpc/rpc-prefix.constants.ts',
	'**/platform/rpc/rpc-serializer.constants.ts',
]

export default defineConfig(({ command }) => ({
	define,
	plugins: [
		tailwindcss(),
		tanstackStart({
			router: {
				routesDirectory: '.',
				virtualRouteConfig: routes,
			},
			importProtection: {
				behavior: 'error',
				client: {
					specifiers: SERVER_ONLY_SPECIFIERS,
					files: SERVER_ONLY_FILES,
					excludeFiles: BROWSER_SAFE_PLATFORM_FILES,
				},
				// '.client.ts' names HTTP clients here, not browser-only modules, so the default server deny list does not apply.
				server: { files: [] },
			},
		}),
		nitro({
			preset: 'bun',
			compatibilityDate: '2025-12-13',
			compressPublicAssets: true,
			// Nitro adds the immutable header for /assets/; a 4xx or 5xx gets errorCacheMiddleware's header instead. The sign-in hand-off pages carry a challenge or a code; handOffPathMiddleware refuses the letter cases these rules miss.
			routeRules: {
				'/**': { headers: { 'cache-control': 'no-cache' } },
				'/desktop/**': { headers: { 'cache-control': 'no-store' } },
				'/android/**': { headers: { 'cache-control': 'no-store' } },
			},
		}),
		react(),
	],
	resolve: {
		tsconfigPaths: true,
	},
	// A CommonJS require of an external package (use-sync-external-store's require('react')) stays a runtime createRequire Nitro cannot bundle; the dev server runs React's CommonJS entry only as an external.
	ssr: { noExternal: command === 'build' ? true : undefined },
}))
