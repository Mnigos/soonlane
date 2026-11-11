import { createFileRoute } from '@tanstack/react-router'
import { IS_ANALYTICS_ENABLED } from '../../domain/analytics.constants'
import { proxyToPostHog } from '../../infrastructure/posthog-proxy.handler'

async function handleIngest(request: Request) {
	if (!IS_ANALYTICS_ENABLED) return new Response('Not Found', { status: 404 })

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
