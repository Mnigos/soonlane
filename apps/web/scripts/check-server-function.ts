import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SITE_URL } from '../src/modules/site/presentation/site.constants'

/**
 * Loads the built Vercel function from a copy outside the repo, as Vercel does
 * from /var/task, so a module Nitro did not trace cannot resolve from the
 * workspace node_modules, and checks that /robots.txt answers per host.
 */
const FUNCTION_DIR = path.resolve(
	import.meta.dirname,
	'../.vercel/output/functions/__server.func'
)

const CASES = [
	{
		host: new URL(SITE_URL).host,
		expected: `Sitemap: ${SITE_URL}/sitemap.xml`,
	},
	{ host: 'soonlist.vercel.app', expected: 'User-agent: *\nDisallow: /\n' },
	{
		host: 'soonlane-git-main-mnigos-projects.vercel.app',
		expected: 'User-agent: *\nDisallow: /\n',
	},
]

interface ServerFunction {
	default: { fetch: (request: Request) => Promise<Response> }
}

function isServerFunction(entry: unknown): entry is ServerFunction {
	return (
		typeof entry === 'object' &&
		entry !== null &&
		'default' in entry &&
		typeof entry.default === 'object' &&
		entry.default !== null &&
		'fetch' in entry.default &&
		typeof entry.default.fetch === 'function'
	)
}

const copyDir = await mkdtemp(path.join(tmpdir(), 'soonlane-server-func-'))

try {
	await cp(FUNCTION_DIR, copyDir, { recursive: true })
	const entry: unknown = await import(path.join(copyDir, 'index.mjs'))

	if (!isServerFunction(entry))
		throw new Error('index.mjs does not export a fetch handler')

	const server = entry.default

	const failures: string[] = []

	for (const { host, expected } of CASES) {
		const response = await server.fetch(
			new Request(`https://${host}/robots.txt`, { headers: { host } })
		)
		const body = await response.text()
		const contentType = response.headers.get('content-type') ?? ''

		if (
			response.status !== 200 ||
			!contentType.startsWith('text/plain') ||
			!body.includes(expected)
		)
			failures.push(
				`${host}/robots.txt: ${response.status} ${contentType}\n${body}`
			)
	}

	if (failures.length > 0) {
		console.error(
			`The built server function fails outside the repo:\n\n${failures.join('\n\n')}`
		)
		process.exitCode = 1
	} else console.log('Server function serves /robots.txt for every host.')
} finally {
	await rm(copyDir, { recursive: true, force: true })
}

process.exit()
