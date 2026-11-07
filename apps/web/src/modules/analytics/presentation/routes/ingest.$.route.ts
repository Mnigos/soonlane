import { createFileRoute } from '@tanstack/react-router'
import { Context } from 'effect'
import { runtime } from '@/platform/app.runtime'
import { AppConfig } from '@/platform/config/app.config'
import { proxyToPostHog } from '../../infrastructure/posthog-proxy.handler'

async function handleIngest(request: Request) {
	const { posthogKey } = Context.get(await runtime.context(), AppConfig)

	if (!posthogKey) return new Response('Not Found', { status: 404 })

	return await proxyToPostHog(request)
}

export const Route = createFileRoute('/ingest/$')({
	server: {
		handlers: {
			GET: async ({ request }) => await handleIngest(request),
			POST: async ({ request }) => await handleIngest(request),
		},
	},
})
