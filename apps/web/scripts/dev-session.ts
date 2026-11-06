import { createHmac, randomBytes } from 'node:crypto'
import { session, user } from '@soonlist/db'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

// Local QA only: a synthetic signed-in owner for screenshots, never a login route in the app.
const SAMPLE_USER = {
	name: 'Sample User',
	email: 'sample@soonlist.test',
	emailVerified: true,
} as const
const PRODUCTION_DATABASE_ENDPOINT = 'ep-broad-resonance-bafgicl3'
const SESSION_COOKIE = 'better-auth.session_token'
const SESSION_TTL_MS = 86_400_000
const TOKEN_BYTES = 24

const shouldDelete = process.argv.includes('--delete')
const databaseUrl = process.env.DATABASE_URL
const secret = process.env.AUTH_SECRET

if (
	process.env.VERCEL_ENV === 'production' ||
	process.env.NODE_ENV === 'production'
)
	throw new Error('dev-session refuses to run in production')
if (
	[databaseUrl, process.env.DATABASE_URL_UNPOOLED].some(url =>
		url?.includes(PRODUCTION_DATABASE_ENDPOINT)
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
		// Sessions and accounts go with the user (onDelete: cascade).
		const deleted = await database
			.delete(user)
			.where(eq(user.email, SAMPLE_USER.email))
			.returning({ id: user.id })
		console.log(`Deleted ${deleted.length} sample user(s) and their sessions.`)
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
			`Start the dev server with OWNER_EMAIL=${SAMPLE_USER.email}, then send this cookie to http://localhost:3000:`
		)
		console.log(`name: ${SESSION_COOKIE}`)
		console.log(`value: ${encodeURIComponent(`${token}.${signature}`)}`)
	}
} finally {
	await pool.end()
}
