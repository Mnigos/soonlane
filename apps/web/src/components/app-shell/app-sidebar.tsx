import { CalendarDays, CalendarFold, PanelLeftClose, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn.util'
import { SidebarNavLink } from './sidebar-nav-link'
import { SidebarUser } from './sidebar-user'

interface AppSidebarProps {
	className?: string
	onClose: () => void
	onNavigate: () => void
}

export function AppSidebar({
	className,
	onClose,
	onNavigate,
}: Readonly<AppSidebarProps>) {
	return (
		<aside
			aria-label="Sidebar"
			className={cn(
				'fixed inset-y-0 left-0 z-40 w-72 shrink-0 flex-col gap-4 overflow-y-auto bg-sidebar px-3 py-2 md:sticky md:top-0 md:h-dvh',
				className
			)}
		>
			<div className="flex h-10 items-center justify-between gap-2">
				<SidebarUser />
				<Button
					aria-label="Close sidebar"
					onClick={onClose}
					size="icon"
					variant="ghost"
				>
					<PanelLeftClose />
				</Button>
			</div>

			<button
				className="group flex h-9 cursor-pointer items-center gap-2.5 rounded-md px-1.5 text-sm font-semibold text-danger transition-colors hover:bg-hover"
				type="button"
			>
				<span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground group-hover:bg-primary-hover">
					<Plus aria-hidden className="size-4" strokeWidth={2.5} />
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

			<section aria-labelledby="sidebar-labels" className="flex flex-col gap-1">
				<h2
					className="px-2 text-sm font-semibold text-muted-foreground"
					id="sidebar-labels"
				>
					Labels
				</h2>
				<p className="px-2 py-1.5 text-label text-faint-foreground">
					No labels yet
				</p>
			</section>
		</aside>
	)
}
