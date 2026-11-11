import { existsSync, readFileSync } from 'node:fs'
import contentCollections from '@content-collections/vite'
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
const APP_ENVIRONMENT = process.env.VERCEL_ENV || 'development'

// Missing until the first stable release.
const CHANGELOG_PATH = new URL('../../CHANGELOG.md', import.meta.url)
const CHANGELOG = existsSync(CHANGELOG_PATH)
	? readFileSync(CHANGELOG_PATH, 'utf-8')
	: ''
const CHANGELOG_MODULE = 'virtual:changelog'

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
	'@soonlane/auth/server',
	'@soonlane/db',
	'@soonlane/db/migrator',
	'pg',
	'posthog-node',
	CHANGELOG_MODULE,
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

// The prerender runs without env vars, so it must stay off routes that read the session.
const NON_PUBLIC_PATHS = [
	'/app',
	'/login',
	'/desktop',
	'/api',
	'/calendar',
	'/robots.txt',
	'/today',
]

function isPublicPath(path: string) {
	return !NON_PUBLIC_PATHS.some(
		prefix => path === prefix || path.startsWith(`${prefix}/`)
	)
}

export default defineConfig({
	define: {
		'import.meta.env.APP_VERSION': JSON.stringify(versionFile.version),
		'import.meta.env.APP_COMMIT': JSON.stringify(APP_COMMIT),
		'import.meta.env.APP_ENVIRONMENT': JSON.stringify(APP_ENVIRONMENT),
	},
	plugins: [
		contentCollections(),
		{
			name: 'changelog',
			resolveId: id =>
				id === CHANGELOG_MODULE ? `\0${CHANGELOG_MODULE}` : undefined,
			load: id =>
				id === `\0${CHANGELOG_MODULE}`
					? `export default ${JSON.stringify(CHANGELOG)}`
					: undefined,
		},
		tailwindcss(),
		tanstackStart({
			router: {
				routesDirectory: '.',
				virtualRouteConfig: routes,
			},
			prerender: {
				enabled: true,
				autoStaticPathsDiscovery: false,
				crawlLinks: true,
				failOnError: true,
				filter: page => isPublicPath(page.path),
			},
			pages: [
				{ path: '/' },
				{ path: '/changelog' },
				{ path: '/privacy' },
				{ path: '/terms' },
				{ path: '/blog' },
				{ path: '/blog/rss.xml' },
				{ path: '/sitemap.xml' },
			],
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
			// The SSR build inlines Base UI's CJS use-sync-external-store, whose require('react') stays a runtime call the trace cannot see; tracing React ships it in the function.
			traceDeps: ['react', 'react-dom'],
			// The preset's 'npx srvx' runs from the package root and, under Bun, makes request.runtime read-only.
			commands: { preview: 'bun ./functions/__server.func/index.mjs' },
			vercel: {
				// Vercel would serve the static feed as generic XML.
				config: {
					version: 3,
					overrides: {
						'blog/rss.xml': {
							contentType: 'application/rss+xml; charset=utf-8',
						},
					},
				},
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
	// The prerender fetches from this server on port 3000; via 'localhost' a dev server on [::1]:3000 answered.
	preview: { host: '127.0.0.1' },
})
