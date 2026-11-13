import path from 'node:path'
import { SITE_URL } from '../src/modules/site/presentation/site.constants'

/**
 * Checks the files Caddy serves, since nothing renders at request time: a
 * page for every sitemap URL, the robots file this build's `APP_ENV` calls
 * for and the not-found page.
 */
const CLIENT_DIR = path.resolve(import.meta.dirname, '../dist/client')
const BLOCKING_ROBOTS = 'User-agent: *\nDisallow: /\n'
const SITEMAP_LOC = /<loc>([^<]+)<\/loc>/gu

async function readOutput(file: string) {
	const output = Bun.file(path.join(CLIENT_DIR, file))

	return (await output.exists()) ? await output.text() : undefined
}

const sitemap = (await readOutput('sitemap.xml')) ?? ''
const robots = await readOutput('robots.txt')
const notFoundPage = await readOutput('404.html')
const failures: string[] = []

for (const [, url = ''] of sitemap.matchAll(SITEMAP_LOC)) {
	const { pathname } = new URL(url)

	if ((await readOutput(path.join(pathname, 'index.html'))) === undefined)
		failures.push(`no page for the sitemap's ${pathname}`)
}

if (!sitemap.includes(`<loc>${SITE_URL}/</loc>`))
	failures.push('the sitemap does not list the home page')
if (
	process.env.APP_ENV === 'production'
		? !robots?.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)
		: robots !== BLOCKING_ROBOTS
)
	failures.push(`robots.txt does not fit APP_ENV=${process.env.APP_ENV}`)
if (!notFoundPage?.includes('Page not found'))
	failures.push('404.html is missing or is not the not-found page')

if (failures.length > 0) {
	console.error(`The static site fails:\n\n${failures.join('\n')}`)
	process.exitCode = 1
} else console.log('The static site passes its checks.')
