import { createFileRoute } from '@tanstack/react-router'
import { buildSitemap } from '../helpers/sitemap.helper'

export const Route = createFileRoute('/site/sitemap.xml')({
	server: {
		handlers: {
			GET: () =>
				new Response(buildSitemap(), {
					headers: { 'Content-Type': 'application/xml; charset=utf-8' },
				}),
		},
	},
})
