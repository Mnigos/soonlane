import { createFileRoute } from '@tanstack/react-router'
import { forwardToApi } from '@/platform/api/api-proxy.handler'

export const Route = createFileRoute('/api/rpc/$')({
	server: {
		handlers: {
			ANY: async ({ request }) => await forwardToApi(request),
		},
	},
})
