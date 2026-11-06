import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_site')({
	component: SiteLayout,
})

function SiteLayout() {
	return (
		<div className="flex min-h-dvh flex-col">
			<Outlet />
		</div>
	)
}
