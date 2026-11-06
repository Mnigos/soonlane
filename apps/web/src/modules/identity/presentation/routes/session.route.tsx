import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_session')({
	beforeLoad: async ({ context }) => ({
		me: await context.queryClient.query(
			context.orpc.identity.me.queryOptions()
		),
	}),
	head: () => ({ meta: [{ name: 'robots', content: 'noindex, nofollow' }] }),
})
