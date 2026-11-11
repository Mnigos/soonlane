import { createFileRoute } from '@tanstack/react-router'
import { forwardToApi } from '@/platform/api/api-proxy.handler'

/** Better Auth runs on the API; the browser and Google's callback still use this origin, so cookies keep their host. */
export const Route = createFileRoute('/api/auth/$')({
	server: {
		handlers: {
			GET: async ({ request }) => await forwardToApi(request),
			POST: async ({ request }) => await forwardToApi(request),
		},
	},
})
