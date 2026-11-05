import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import { routes } from './src/routes'

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

// The browser half of the oRPC client lives in platform/rpc next to the server half; these files are the only platform code the client may import. The custom list replaces the default, so it repeats node_modules.
const BROWSER_SAFE_PLATFORM_FILES = [
	'**/node_modules/**',
	'**/platform/rpc/rpc.client.ts',
	'**/platform/rpc/rpc-query.client.ts',
	'**/platform/rpc/rpc-prefix.constants.ts',
	'**/platform/rpc/rpc-serializer.constants.ts',
]

export default defineConfig({
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
					files: SERVER_ONLY_FILES,
					excludeFiles: BROWSER_SAFE_PLATFORM_FILES,
				},
				// '.client.ts' names HTTP clients here, not browser-only modules, so the default server deny list does not apply.
				server: { files: [] },
			},
		}),
		nitro({
			// The Vercel build runs Vite under Node: under Bun, Nitro adds the 'bun' export condition and bundles React's Bun-only SSR stream.
			preset: 'vercel',
			compatibilityDate: '2025-12-13',
			compressPublicAssets: true,
			vercel: {
				// Pinned so the function runtime never follows the build machine; fra1 sits next to the Neon database in eu-central-1.
				functions: {
					runtime: 'nodejs22.x',
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
