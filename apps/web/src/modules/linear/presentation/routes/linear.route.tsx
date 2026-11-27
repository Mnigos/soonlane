import { APP_PATHS } from '@soonlane/app/app-paths'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { runLinearLink } from '../helpers/linear-link.helper'

const linearSearchSchema = z.object({
	error: z.string().optional().catch(undefined),
	returned: z.boolean().optional().catch(undefined),
})

/** Where the user menu, also the desktop app's through the system browser, starts linking Linear and where Linear returns; browser-only, since the link needs the page's cookies, and it shows nothing of its own. */
export const Route = createFileRoute('/_session/_shell/linear')({
	ssr: false,
	validateSearch: linearSearchSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ context, deps }) => {
		if (!(await runLinearLink(context.queryClient, deps)))
			throw redirect({ to: APP_PATHS.upcoming, replace: true })
	},
	head: () => ({ meta: [{ title: 'Linear · Soonlane' }] }),
	component: () => null,
})
