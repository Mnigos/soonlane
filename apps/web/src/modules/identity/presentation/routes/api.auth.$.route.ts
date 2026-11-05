import { createFileRoute } from '@tanstack/react-router'
import { Context } from 'effect'
import { runtime } from '@/platform/app.runtime'
import { Auth } from '../../application/auth.port'

async function handleAuth(request: Request) {
	const services = await runtime.context()

	return await Context.get(services, Auth).handle(request)
}

export const Route = createFileRoute('/api/auth/$')({
	server: {
		handlers: {
			GET: async ({ request }) => await handleAuth(request),
			POST: async ({ request }) => await handleAuth(request),
		},
	},
})
