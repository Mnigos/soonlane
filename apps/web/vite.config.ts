import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import versionFile from '../../version.json' with { type: 'json' }
import { routes } from './src/routes'

// The product version comes from version.json (written by the release workflow); the commit from Vercel, 'dev' locally.
const SHORT_SHA_LENGTH = 7
const APP_COMMIT =
	process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, SHORT_SHA_LENGTH) || 'dev'

// A custom list replaces TanStack Start's default client deny list, so it repeats '**/*.server.*'.
const SERVER_ONLY_FILES = [
	'**/*.server.*',
	'**/platform/**',
	'**/application/**',
	'**/infrastructure/**',
	'**/*.router.ts',
	'**/*.handler.ts',
	'**/*.port.ts',
	'**/*.service.ts',
	'**/*.repository.ts',
	'**/*.layer.ts',
	'**/*.middleware.ts',
	'**/routes/api.*',
]

// Server-only workspace packages and drivers resolve outside the app's folders, so they are denied by specifier. The custom list replaces the default, so it repeats '@tanstack/react-start/server'.
const SERVER_ONLY_SPECIFIERS = [
	'@tanstack/react-start/server',
	'@soonlist/auth/server',
	'@soonlist/db',
	'@soonlist/db/migrator',
	'pg',
	/^drizzle-orm(\/|$)/u,
]

// The browser half of the oRPC client lives in platform/rpc next to the server half; these files are the only platform code the client may import. The custom list replaces the default, so it repeats node_modules.
const BROWSER_SAFE_PLATFORM_FILES = [
	'**/node_modules/**',
	'**/platform/rpc/rpc.client.ts',
	'**/platform/rpc/rpc-query.client.ts',
	'**/platform/rpc/rpc-prefix.constants.ts',
	'**/platform/rpc/rpc-serializer.constants.ts',
]

export default defineConfig({
	define: {
		'import.meta.env.APP_VERSION': JSON.stringify(versionFile.version),
		'import.meta.env.APP_COMMIT': JSON.stringify(APP_COMMIT),
	},
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
			preset: 'vercel',
			compatibilityDate: '2025-12-13',
			compressPublicAssets: true,
			vercel: {
				// Nitro's default 'bun1.x' is Bun 1.3; 'bun1.4.x' matches bunVersion in vercel.json. fra1 sits next to the Neon database in eu-central-1.
				functions: {
					runtime: 'bun1.4.x',
					maxDuration: 60,
					regions: ['fra1'],
				},
			},
		}),
		react(),
	],
	resolve: {
		tsconfigPaths: true,
	},
	server: {
		port: 3000,
		strictPort: true,
	},
})
