import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import contentCollections from '@content-collections/vite'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'
import versionFile from '../../version.json' with { type: 'json' }
import { routes } from './src/routes'

const SHORT_SHA_LENGTH = 7
const APP_ENVIRONMENTS = ['production', 'staging', 'development'] as const
/** Written by the staging deploy, since `railway up` uploads no git metadata; GitHub deploys on Railway set RAILWAY_GIT_COMMIT_SHA. */
const COMMIT_FILE = new URL('commit.env', import.meta.url)
/** The deployed commit, 'dev' locally; the product version comes from version.json (written by the release workflow). */
const APP_COMMIT = (
	process.env.RAILWAY_GIT_COMMIT_SHA ||
	(existsSync(COMMIT_FILE)
		? parseEnv(readFileSync(COMMIT_FILE, 'utf-8')).APP_COMMIT
		: undefined) ||
	'dev'
).slice(0, SHORT_SHA_LENGTH)
const APP_ENVIRONMENT = process.env.APP_ENV || 'development'

if (!isAppEnvironment(APP_ENVIRONMENT))
	throw new Error(
		`APP_ENV must be one of ${APP_ENVIRONMENTS.join(', ')}, not "${APP_ENVIRONMENT}"`
	)

/** Without the API's origin or the cookie prefix, deployed pages call no API and look signed out, so only development may fall back. */
const API_VARIABLES = ['VITE_API_URL', 'VITE_AUTH_COOKIE_PREFIX'] as const

for (const name of API_VARIABLES)
	if (APP_ENVIRONMENT !== 'development' && !process.env[name])
		throw new Error(
			`${name} is not set; ${APP_ENVIRONMENT} builds need it (docs/deploy-railway.md)`
		)

/** Missing until the first stable release. */
const CHANGELOG_PATH = new URL('../../CHANGELOG.md', import.meta.url)
const CHANGELOG = existsSync(CHANGELOG_PATH)
	? readFileSync(CHANGELOG_PATH, 'utf-8')
	: ''
const CHANGELOG_MODULE = 'virtual:changelog'

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
	CHANGELOG_MODULE,
]

/** The browser half of the oRPC client lives in platform/rpc next to the server half; these files are the only platform code the client may import. The custom list replaces the default, so it repeats node_modules. */
const BROWSER_SAFE_PLATFORM_FILES = [
	'**/node_modules/**',
	'**/platform/rpc/rpc.client.ts',
	'**/platform/rpc/rpc-query.client.ts',
	'**/platform/rpc/rpc-prefix.constants.ts',
	'**/platform/rpc/rpc-serializer.constants.ts',
]

/** Rendered per request: the prerender runs without env vars, so it stays off routes that read the session or the host, and the feeds keep the content type their routes set, which a static file would lose. */
const SERVER_RENDERED_PATHS = [
	'/app',
	'/login',
	'/desktop',
	'/api',
	'/calendar',
	'/robots.txt',
	'/today',
	'/health',
	'/blog/rss.xml',
	'/sitemap.xml',
]

function isAppEnvironment(
	name: string
): name is (typeof APP_ENVIRONMENTS)[number] {
	return APP_ENVIRONMENTS.some(environment => environment === name)
}

function isPrerenderedPath(path: string) {
	return !SERVER_RENDERED_PATHS.some(
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
					? `export const changelog = ${JSON.stringify(CHANGELOG)}`
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
				filter: page => isPrerenderedPath(page.path),
			},
			pages: [
				{ path: '/' },
				{ path: '/changelog' },
				{ path: '/privacy' },
				{ path: '/terms' },
				{ path: '/blog' },
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
	// The prerender fetches from this server on port 3000; via 'localhost' a dev server on [::1]:3000 answered.
	preview: { host: '127.0.0.1' },
})
