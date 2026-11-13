import { createFileRoute } from '@tanstack/react-router'
import { buildRss } from '../helpers/rss.helper'

export const Route = createFileRoute('/site/blog/rss.xml')({
	server: {
		handlers: {
			GET: () =>
				new Response(buildRss(), {
					headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
				}),
		},
	},
})
