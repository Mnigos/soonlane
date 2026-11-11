import { createFileRoute, Outlet } from '@tanstack/react-router'
import { LayoutError } from '@/components/route-error'
import {
	BLOG_TITLE,
	RSS_PATH,
} from '@/modules/blog/presentation/blog.constants'
import { SiteFooter } from '../components/site-footer'
import { SiteHeader } from '../components/site-header'

export const Route = createFileRoute('/_site')({
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
