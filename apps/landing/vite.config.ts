import { existsSync, readFileSync } from 'node:fs'
import contentCollections from '@content-collections/vite'
import { readBuildInfo } from '@soonlane/vite-config/build-info'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { routes } from './src/routes'

const { define } = readBuildInfo(new URL('.', import.meta.url))
/** Missing until the first stable release. */
const CHANGELOG_PATH = new URL('../../CHANGELOG.md', import.meta.url)
const CHANGELOG = existsSync(CHANGELOG_PATH)
	? readFileSync(CHANGELOG_PATH, 'utf-8')
	: ''
const CHANGELOG_MODULE = 'virtual:changelog'

/**
 * Every page is prerendered and Caddy serves `dist/client` alone; the server build exists only for the prerender. The crawl
 * follows links from these pages; the feeds and robots are written as files, and `/404` becomes the not-found page.
 */
export default defineConfig({
	define,
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
			},
			pages: [
				{ path: '/' },
				{ path: '/changelog' },
				{ path: '/privacy' },
				{ path: '/terms' },
				{ path: '/blog' },
				{ path: '/404', prerender: { outputPath: '/404.html' } },
				{ path: '/robots.txt' },
				{ path: '/sitemap.xml' },
				{ path: '/blog/rss.xml' },
			],
			// `@soonlane/analytics/client` is a package entry the router runs in both environments, not a browser-only module.
			importProtection: { server: { files: [] } },
		}),
		react(),
	],
	resolve: {
		tsconfigPaths: true,
	},
	// The prerender fetches from the preview server; via 'localhost' another server on [::1] could answer.
	preview: { host: '127.0.0.1' },
})
