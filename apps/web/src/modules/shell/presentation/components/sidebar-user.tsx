import { Avatar } from '@soonlist/ui/components/avatar'

export function SidebarUser() {
	return (
		<div className="flex min-w-0 items-center gap-2 px-1">
			<Avatar name="Soonlist" />

			<span className="truncate text-sm font-semibold">Soonlist</span>
		</div>
	)
}
