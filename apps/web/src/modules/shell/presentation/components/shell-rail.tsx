import type { SessionUser } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Avatar } from '@soonlane/ui/components/avatar'
import {
	SidebarRail,
	sidebarRailItemVariants,
} from '@soonlane/ui/components/sidebar'
import {
	CalendarDays,
	CalendarFold,
	PanelLeftOpen,
	Plus,
	Tag,
} from 'lucide-react'
import { DesktopDragRegion } from './desktop-drag-region'
import { RailNavLink } from './rail-nav-link'

interface ShellRailProps {
	className?: string
	user: SessionUser
	onAddTask: () => void
	onExpand: () => void
}

export function ShellRail({
	className,
	user,
	onAddTask,
	onExpand,
}: Readonly<ShellRailProps>) {
	return (
		<SidebarRail
			aria-label="Sidebar"
			className={cn('fixed inset-y-0 left-0 z-20 desktop:pt-8', className)}
		>
			<DesktopDragRegion />

			<button
				aria-label={`${user.name}, open the account menu`}
				className={sidebarRailItemVariants()}
				onClick={onExpand}
				title={user.name}
				type="button"
			>
				<Avatar name={user.name} src={user.image} />
			</button>

			<button
				aria-label="Expand sidebar"
				className={sidebarRailItemVariants()}
				onClick={onExpand}
				title="Expand sidebar"
				type="button"
			>
				<PanelLeftOpen aria-hidden />
			</button>

			<button
				aria-label="Add task"
				className={cn(
					sidebarRailItemVariants(),
					'text-danger hover:text-danger'
				)}
				onClick={onAddTask}
				title="Add task"
				type="button"
			>
				<span className="flex size-5.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
					<Plus aria-hidden className="size-3.5" strokeWidth={2.5} />
				</span>
			</button>

			<nav aria-label="Views" className="flex flex-col gap-0.5">
				<RailNavLink icon={CalendarDays} label="Upcoming" to="/" />

				<RailNavLink icon={CalendarFold} label="Today" to="/today" />
			</nav>

			<button
				aria-label="Labels"
				className={sidebarRailItemVariants()}
				onClick={onExpand}
				title="Labels"
				type="button"
			>
				<Tag aria-hidden />
			</button>
		</SidebarRail>
	)
}
