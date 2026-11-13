import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Client } from 'pg'

export const MIGRATIONS_FOLDER = fileURLToPath(
	new URL('migrations', import.meta.url)
)

export function resolveMigrationUrl(env: Record<string, string | undefined>) {
	const url = env.DATABASE_URL

	if (!url) throw new Error('Set DATABASE_URL before running migrations.')

	return url
}

export async function runMigrations(connectionString: string) {
	// Pool.end() resolves before sockets close; Client.end() waits for the socket.
	const client = new Client({ connectionString })

	await client.connect()
	try {
		await migrate(drizzle({ client }), { migrationsFolder: MIGRATIONS_FOLDER })
	} finally {
		await client.end()
	}
}
