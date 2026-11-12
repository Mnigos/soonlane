import { createFileRoute } from '@tanstack/react-router'

/** Railway's deploy health check: answers without the API or the database, so a web deploy never waits on them. */
export const Route = createFileRoute('/health')({
	server: {
		handlers: {
			GET: () =>
				Response.json({
					ok: true,
					environment: import.meta.env.APP_ENVIRONMENT,
					commit: import.meta.env.APP_COMMIT,
				}),
		},
	},
})
