import { createFileRoute } from '@tanstack/react-router'
import { LayoutError } from '@/components/route-error'

export const Route = createFileRoute('/_session')({
	beforeLoad: async ({ context }) => ({
		me: await context.queryClient.query(
			context.orpc.identity.me.queryOptions()
		),
	}),
	errorComponent: LayoutError,
	head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
})
