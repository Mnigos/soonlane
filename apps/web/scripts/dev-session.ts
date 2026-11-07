import { createHmac, randomBytes } from 'node:crypto'
import { session, user } from '@soonlane/db'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

// Local QA only: the app itself has no test login.
const SAMPLE_USER = {
	name: 'Sample User',
	email: 'sample@soonlane.test',
	emailVerified: true,
} as const
const SESSION_COOKIE = 'better-auth.session_token'
const SESSION_TTL_MS = 86_400_000
const TOKEN_BYTES = 24
const shouldDelete = process.argv.includes('--delete')
const databaseUrl = process.env.DATABASE_URL
const secret = process.env.AUTH_SECRET
// The production Neon endpoint comes from the environment, so the open-source script never names it.
const productionDatabaseHost = process.env.PRODUCTION_DATABASE_HOST?.trim()

function getHost(url: string | undefined) {
	if (!url) return ''

	try {
		return new URL(url).hostname
	} catch {
		return ''
	}
}

if (
	process.env.VERCEL_ENV === 'production' ||
	process.env.NODE_ENV === 'production'
)
	throw new Error('dev-session refuses to run in production')
if (!productionDatabaseHost)
	throw new Error(
		'PRODUCTION_DATABASE_HOST must be set so dev-session can refuse the production database'
	)
if (
	[databaseUrl, process.env.DATABASE_URL_UNPOOLED].some(url =>
		getHost(url).includes(productionDatabaseHost)
	)
)
	throw new Error('dev-session refuses to touch the production database')
if (!(databaseUrl && secret))
	throw new Error(
		'DATABASE_URL and AUTH_SECRET must be set (bun run dev:session)'
	)

const pool = new Pool({ connectionString: databaseUrl })

try {
	const database = drizzle({ client: pool })

	if (shouldDelete) {
		const deleted = await database
			.delete(user)
			.where(eq(user.email, SAMPLE_USER.email))
			.returning({ id: user.id })
		console.log(
			`Deleted ${deleted.length} sample user(s) with their sessions and tasks.`
		)
	} else {
		const [sample] = await database
			.insert(user)
			.values(SAMPLE_USER)
			.onConflictDoUpdate({ target: user.email, set: SAMPLE_USER })
			.returning({ id: user.id })

		if (!sample) throw new Error('Sample user upsert returned no rows')

		const token = randomBytes(TOKEN_BYTES).toString('hex')

		await database.insert(session).values({
			userId: sample.id,
			token,
			expiresAt: new Date(Date.now() + SESSION_TTL_MS),
		})

		// Better Auth's signed cookie: the token, a dot and its HMAC-SHA256 in base64.
		const signature = createHmac('sha256', secret)
			.update(token)
			.digest('base64')

		console.log(
			`Send this cookie to the dev server (with ALLOWED_EMAILS set, it must include ${SAMPLE_USER.email}):`
		)
		console.log(`name: ${SESSION_COOKIE}`)
		console.log(`value: ${encodeURIComponent(`${token}.${signature}`)}`)
	}
} finally {
	await pool.end()
}
