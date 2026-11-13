import { readBuildInfo } from '@soonlane/vite-config/build-info'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import { routes } from './src/routes'

const { environment, define } = readBuildInfo(new URL('.', import.meta.url))

/** Without the API's origin or the cookie prefix, deployed pages call no API and look signed out, and without the site's origin the links to the public pages go nowhere, so only development may fall back. */
const REQUIRED_VARIABLES = [
	'VITE_API_URL',
	'VITE_AUTH_COOKIE_PREFIX',
	'VITE_SITE_URL',
] as const

for (const name of REQUIRED_VARIABLES)
	if (environment !== 'development' && !process.env[name])
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

export default defineConfig({
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
			// Nitro adds the immutable header for /assets/; a 4xx or 5xx gets errorCacheMiddleware's header instead.
			routeRules: { '/**': { headers: { 'cache-control': 'no-cache' } } },
		}),
		react(),
	],
	resolve: {
		tsconfigPaths: true,
	},
})
