import { createFileRoute, Outlet } from '@tanstack/react-router'
import { NotFound } from '@/components/not-found'
import { LayoutError } from '@/components/route-error'
import {
	BLOG_TITLE,
	RSS_PATH,
} from '@/modules/blog/presentation/blog.constants'
import { SiteFooter } from '../components/site-footer'
import { SiteHeader } from '../components/site-header'
import { syncSignedInHint } from '../helpers/signed-in-hint.helper'

export const Route = createFileRoute('/site')({
	onEnter: syncSignedInHint,
	head: () => ({
		links: [
			{
				rel: 'alternate',
				type: 'application/rss+xml',
				title: BLOG_TITLE,
				href: RSS_PATH,
			},
		],
	}),
	component: SiteLayout,
	errorComponent: LayoutError,
	notFoundComponent: () => (
		<NotFound className="flex-1 py-16" homePath="/site" />
	),
})

function SiteLayout() {
	return (
		<div className="flex min-h-dvh flex-col [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-primary">
			<SiteHeader />

			<Outlet />

			<SiteFooter />
		</div>
	)
}
