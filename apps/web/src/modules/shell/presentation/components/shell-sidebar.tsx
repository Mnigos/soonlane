import { APP_PATHS } from '@soonlane/app/app-paths'
import { useHostApp } from '@soonlane/app/hooks/use-host-app'
import { cn } from '@soonlane/ui/cn'
import { Button } from '@soonlane/ui/components/button'
import { Sidebar } from '@soonlane/ui/components/sidebar'
import { CalendarDays, CalendarFold, PanelLeftClose, Plus } from 'lucide-react'
import { SidebarLabels } from '@/modules/labels/presentation/components/sidebar-labels'
import { DesktopDragRegion } from './desktop-drag-region'
import { SidebarNavLink } from './sidebar-nav-link'

interface ShellSidebarProps {
	className?: string
	activeLabelName?: string
	onAddTask: () => void
	onCollapse: () => void
	onNavigate: () => void
	onShowShortcuts: () => void
}

export function ShellSidebar({
	className,
	activeLabelName,
	onAddTask,
	onCollapse,
	onNavigate,
	onShowShortcuts,
}: Readonly<ShellSidebarProps>) {
	const { renderUserMenu, appVersion, appCommit, releaseNotesUrl } =
		useHostApp()

	return (
		<Sidebar
			aria-label="Sidebar"
			className={cn('fixed inset-y-0 left-0 z-40 desktop:pt-8', className)}
		>
			<DesktopDragRegion />

			<div className="flex items-start justify-between gap-2 pt-0.5">
				{renderUserMenu(onShowShortcuts)}

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
				className="group flex h-8 cursor-pointer items-center gap-2 rounded-md px-1.5 text-sm font-semibold text-danger transition-colors hover:bg-hover"
				onClick={onAddTask}
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
					to={APP_PATHS.upcoming}
				/>

				<SidebarNavLink
					icon={CalendarFold}
					label="Today"
					onNavigate={onNavigate}
					to={APP_PATHS.today}
				/>
			</nav>

			<SidebarLabels
				activeLabelName={activeLabelName}
				onNavigate={onNavigate}
			/>

			<a
				className="mt-auto px-2 py-1 text-caption text-faint-foreground transition-colors hover:text-muted-foreground"
				href={releaseNotesUrl}
				rel="noreferrer"
				target="_blank"
				title="Release notes"
			>
				v{appVersion} · {appCommit}
			</a>
		</Sidebar>
	)
}
