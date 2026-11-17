import { existsSync, readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import contentCollections from '@content-collections/vite'
import mdx from '@mdx-js/rollup'
import { readBuildInfo } from '@soonlane/vite-config/build-info'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { defineConfig } from 'vite'
import { z } from 'zod'
import { routes } from './src/routes'

const { define } = readBuildInfo(new URL('.', import.meta.url))
/** Missing until the first stable release. */
const CHANGELOG_PATH = new URL('../../CHANGELOG.md', import.meta.url)
const CHANGELOG = existsSync(CHANGELOG_PATH)
	? readFileSync(CHANGELOG_PATH, 'utf-8')
	: ''
const CHANGELOG_MODULE = 'virtual:changelog'
const POST_CONTENTS_MODULE = 'virtual:post-contents'
const GENERATED_POSTS = new URL(
	'.content-collections/generated/allPosts.js',
	import.meta.url
)
const POSTS_DIRECTORY = new URL('src/modules/blog/content/', import.meta.url)
const generatedPostsSchema = z.object({
	default: z.array(
		z.object({ slug: z.string(), _meta: z.object({ filePath: z.string() }) })
	),
})

/**
 * Imports the body of every post content-collections lists, by slug. Drafts it skips in production get no module, so their
 * text never reaches a script, which a glob over the folder would ship.
 */
async function loadPostContents() {
	// A data URL, because Bun keeps a file module cached whatever its query string.
	const generated: unknown = await import(
		`data:text/javascript,${encodeURIComponent(await readFile(GENERATED_POSTS, 'utf-8'))}`
	)
	const { default: posts } = generatedPostsSchema.parse(generated)

	return [
		...posts.map(
			({ _meta }, index) =>
				`import Post${index} from ${JSON.stringify(fileURLToPath(new URL(_meta.filePath, POSTS_DIRECTORY)))}`
		),
		`export const postContents = new Map([${posts.map(({ slug }, index) => `[${JSON.stringify(slug)}, Post${index}]`).join(', ')}])`,
	].join('\n')
}

/**
 * Every page is prerendered and Caddy serves `dist/client` alone; the server build exists only for the prerender. The crawl
 * follows links from these pages; the feeds and robots are written as files, and `/404` becomes the not-found page.
 */
export default defineConfig({
	define,
	plugins: [
		contentCollections(),
		{
			enforce: 'pre',
			...mdx({ remarkPlugins: [remarkFrontmatter, remarkGfm] }),
		},
		{
			name: 'changelog',
			resolveId: id =>
				id === CHANGELOG_MODULE ? `\0${CHANGELOG_MODULE}` : undefined,
			load: id =>
				id === `\0${CHANGELOG_MODULE}`
					? `export const changelog = ${JSON.stringify(CHANGELOG)}`
					: undefined,
		},
		{
			name: 'post-contents',
			resolveId: id =>
				id === POST_CONTENTS_MODULE ? `\0${POST_CONTENTS_MODULE}` : undefined,
			async load(id) {
				if (id !== `\0${POST_CONTENTS_MODULE}`) return undefined

				this.addWatchFile(fileURLToPath(GENERATED_POSTS))

				return await loadPostContents()
			},
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
