import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SiteFooter } from '../components/site-footer'
import { SiteHeader } from '../components/site-header'

export const Route = createFileRoute('/_site')({
	component: SiteLayout,
})

function SiteLayout() {
	return (
		// Text links get the same red focus outline as buttons (DESIGN.md).
		<div className="flex min-h-dvh flex-col [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:focus-visible:outline-primary">
			<SiteHeader />

			<Outlet />

			<SiteFooter />
		</div>
	)
}
