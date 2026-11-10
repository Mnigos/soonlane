import path from 'node:path'
import { z } from 'zod'

/**
 * Nitro's Vercel preset sets the immutable header for /assets/ before the
 * filesystem check, which gives a chunk missing from the deployment a 404 that
 * browsers and Vercel's edge keep for a year. This rewrites the build output
 * so the header applies only to files that exist (Vercel's hit phase), as
 * Next.js does for /_next/static. Routes after the filesystem check run only
 * when no file matched, so a missing asset answers a 404 nothing may store
 * there and never reaches the server function.
 */
const CONFIG_PATH = path.resolve(
	import.meta.dirname,
	'../.vercel/output/config.json'
)
const ASSETS_ROUTE = '/assets/(.*)'

const buildConfigSchema = z.looseObject({
	routes: z.array(
		z.looseObject({
			src: z.string().optional(),
			handle: z.string().optional(),
		})
	),
})

const config = buildConfigSchema.parse(await Bun.file(CONFIG_PATH).json())
const otherRoutes = config.routes.filter(route => route.src !== ASSETS_ROUTE)
const filesystemIndex = otherRoutes.findIndex(
	route => route.handle === 'filesystem'
)

if (otherRoutes.length === config.routes.length || filesystemIndex === -1)
	throw new Error(
		`Nitro no longer writes the ${ASSETS_ROUTE} route before the filesystem check`
	)

await Bun.write(
	CONFIG_PATH,
	JSON.stringify(
		{
			...config,
			routes: [
				...otherRoutes.slice(0, filesystemIndex + 1),
				{
					src: ASSETS_ROUTE,
					status: 404,
					headers: { 'cache-control': 'no-store' },
				},
				...otherRoutes.slice(filesystemIndex + 1),
				{ handle: 'hit' },
				{
					src: ASSETS_ROUTE,
					headers: { 'cache-control': 'public, max-age=31536000, immutable' },
					continue: true,
					important: true,
				},
			],
		},
		null,
		2
	)
)

console.log('Assets keep the immutable header only when they exist.')
