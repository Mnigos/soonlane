import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Shell } from '../components/shell'

export const Route = createFileRoute('/_shell')({
	component: ShellRoute,
})

function ShellRoute() {
	return (
		<Shell>
			<Outlet />
		</Shell>
	)
}
