import type { SessionUser } from '@soonlist/contracts'
import { cn } from '@soonlist/ui/cn'
import { Button } from '@soonlist/ui/components/button'
import { Sidebar, SidebarSection } from '@soonlist/ui/components/sidebar'
import { CalendarDays, CalendarFold, PanelLeftClose, Plus } from 'lucide-react'
import { UserMenu } from '@/modules/identity/presentation/components/user-menu'
import { APP_COMMIT, APP_VERSION, RELEASES_URL } from '../build-info.constants'
import { SidebarNavLink } from './sidebar-nav-link'

interface ShellSidebarProps {
	className?: string
	user: SessionUser
	onCollapse: () => void
	onNavigate: () => void
}

export function ShellSidebar({
	className,
	user,
	onCollapse,
	onNavigate,
}: Readonly<ShellSidebarProps>) {
	return (
		<Sidebar
			aria-label="Sidebar"
			className={cn('fixed inset-y-0 left-0 z-40', className)}
		>
			<div className="flex items-start justify-between gap-2 pt-0.5">
				<UserMenu user={user} />

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

			<a
				className="mt-auto px-2 py-1 text-caption text-faint-foreground transition-colors hover:text-muted-foreground"
				href={RELEASES_URL}
				rel="noreferrer"
				target="_blank"
				title="Release notes"
			>
				v{APP_VERSION} · {APP_COMMIT}
			</a>
		</Sidebar>
	)
}
