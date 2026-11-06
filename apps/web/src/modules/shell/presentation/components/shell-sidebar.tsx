import { cn } from '@soonlist/ui/cn'
import { Button } from '@soonlist/ui/components/button'
import { Sidebar, SidebarSection } from '@soonlist/ui/components/sidebar'
import { CalendarDays, CalendarFold, PanelLeftClose, Plus } from 'lucide-react'
import { SidebarNavLink } from './sidebar-nav-link'
import { SidebarUser } from './sidebar-user'

interface ShellSidebarProps {
	className?: string
	onCollapse: () => void
	onNavigate: () => void
}

export function ShellSidebar({
	className,
	onCollapse,
	onNavigate,
}: Readonly<ShellSidebarProps>) {
	return (
		<Sidebar
			aria-label="Sidebar"
			className={cn('fixed inset-y-0 left-0 z-40', className)}
		>
			<div className="flex h-10 items-center justify-between gap-2">
				<SidebarUser />

				<Button
					aria-label="Collapse sidebar"
					onClick={onCollapse}
					size="icon"
					title="Collapse sidebar"
					variant="ghost"
				>
					<PanelLeftClose />
				</Button>
			</div>

			<button
				className="group flex h-8.5 cursor-pointer items-center gap-2.5 rounded-md px-1.5 text-sm font-semibold text-danger transition-colors hover:bg-hover"
				type="button"
			>
				<span className="flex size-5.5 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:bg-primary-hover">
					<Plus aria-hidden className="size-3.5" strokeWidth={2.5} />
				</span>
				Add task
			</button>

			<nav aria-label="Views" className="flex flex-col gap-0.5">
				<SidebarNavLink
					icon={CalendarDays}
					label="Upcoming"
					onNavigate={onNavigate}
					to="/"
				/>

				<SidebarNavLink
					icon={CalendarFold}
					label="Today"
					onNavigate={onNavigate}
					to="/today"
				/>
			</nav>

			<SidebarSection label="Labels">
				<p className="px-2 py-1.5 text-label text-faint-foreground">
					No labels yet
				</p>
			</SidebarSection>
		</Sidebar>
	)
}
