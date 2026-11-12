import { cp, mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SITE_URL } from '../src/modules/site/presentation/site.constants'

/**
 * Starts the built server from a copy outside the repo, as Railway runs it, so
 * a module Nitro did not bundle cannot resolve from the workspace
 * node_modules, and checks what the hosting depends on: robots per host, a
 * prerendered page read from disk, compression, the asset cache headers and
 * the health route.
 */
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../.output')
const IMMUTABLE = 'immutable'
const BLOCKING_ROBOTS = 'User-agent: *\nDisallow: /\n'
/** Added to the copy's prerendered page only, so seeing it proves the server read the file instead of rendering the page. */
const DISK_MARKER = '<!-- read from disk -->'
const PRERENDERED_PAGE = 'privacy'
const START_TIMEOUT_MS = 10_000
const POLL_INTERVAL_MS = 100

interface Case {
	name: string
	path: string
	headers?: Record<string, string>
	check: (response: Response, body: string) => boolean
}

async function findFreePort() {
	const probe = Bun.serve({ port: 0, fetch: () => new Response() })
	const { port } = probe

	await probe.stop(true)

	return port
}

async function waitForHealth(origin: string, deadline: number) {
	while (Date.now() < deadline) {
		try {
			const response = await fetch(`${origin}/health`)

			if (response.ok) return
		} catch {
			// Not listening yet.
		}
		await Bun.sleep(POLL_INTERVAL_MS)
	}

	throw new Error(
		`The server did not answer /health within ${START_TIMEOUT_MS} ms`
	)
}

const assets = await readdir(path.join(OUTPUT_DIR, 'public/assets'))
const asset = assets.find(
	name => name.endsWith('.js') && assets.includes(`${name}.br`)
)

if (!asset)
	throw new Error('The build wrote no precompressed script to public/assets')

const CASES: Case[] = [
	{
		name: 'robots on the canonical host, gzipped',
		path: '/robots.txt',
		headers: { host: new URL(SITE_URL).host, 'accept-encoding': 'gzip' },
		check: (response, body) =>
			response.ok &&
			response.headers.get('content-encoding') === 'gzip' &&
			body.includes(`Sitemap: ${SITE_URL}/sitemap.xml`),
	},
	...['staging.soonlane.com', 'www.soonlane.com'].map(host => ({
		name: `robots on ${host}`,
		path: '/robots.txt',
		headers: { host },
		check: (response: Response, body: string) =>
			response.ok && body === BLOCKING_ROBOTS,
	})),
	{
		name: 'a prerendered page read from disk, compressed and revalidated',
		path: `/${PRERENDERED_PAGE}`,
		headers: { 'accept-encoding': 'gzip' },
		check: (response, body) =>
			response.ok &&
			body.endsWith(DISK_MARKER) &&
			response.headers.get('content-type') === 'text/html; charset=utf-8' &&
			response.headers.get('content-encoding') === 'gzip' &&
			response.headers.get('cache-control') === 'no-cache',
	},
	{
		name: 'an existing asset, precompressed and cached for good',
		path: `/assets/${asset}`,
		headers: { 'accept-encoding': 'br' },
		check: response =>
			response.ok &&
			response.headers.get('content-encoding') === 'br' &&
			(response.headers.get('cache-control') ?? '').includes(IMMUTABLE),
	},
	{
		name: 'a missing asset, a 404 nobody keeps',
		path: '/assets/missing-chunk.js',
		check: response =>
			response.status === 404 &&
			response.headers.get('cache-control') === 'no-store',
	},
	{
		name: 'the health route',
		path: '/health',
		check: (response, body) => response.ok && body.includes('"ok":true'),
	},
]

const copyDir = await mkdtemp(path.join(tmpdir(), 'soonlane-web-server-'))
const port = await findFreePort()
const origin = `http://127.0.0.1:${port}`

await cp(OUTPUT_DIR, path.join(copyDir, '.output'), { recursive: true })

const pagePath = path.join(
	copyDir,
	'.output/public',
	PRERENDERED_PAGE,
	'index.html'
)

await Bun.write(pagePath, `${await Bun.file(pagePath).text()}${DISK_MARKER}`)

const server = Bun.spawn(['bun', '.output/server/index.mjs'], {
	cwd: copyDir,
	env: { ...process.env, PORT: String(port) },
	stdout: 'ignore',
	stderr: 'inherit',
})

try {
	await waitForHealth(origin, Date.now() + START_TIMEOUT_MS)

	const failures: string[] = []

	for (const { name, path: casePath, headers, check } of CASES) {
		const response = await fetch(`${origin}${casePath}`, { headers })
		const body = await response.text()

		if (!check(response, body))
			failures.push(
				`${name} (${casePath}): ${response.status} ${JSON.stringify(Object.fromEntries(response.headers))}`
			)
	}

	if (failures.length > 0) {
		console.error(`The built server fails:\n\n${failures.join('\n')}`)
		process.exitCode = 1
	} else console.log(`The built server passes ${CASES.length} checks.`)
} finally {
	server.kill()
	await server.exited
	await rm(copyDir, { recursive: true, force: true })
}
