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
	Hash,
	Inbox,
	PanelLeftOpen,
	Plus,
	Search,
	Tag,
} from 'lucide-react'
import { APP_PATHS } from '../../../app-path.constants'
import { DesktopDragRegion } from './desktop-drag-region'
import { RailNavLink } from './rail-nav-link'

interface ShellRailProps {
	className?: string
	user: SessionUser
	onAddTask: () => void
	onExpand: () => void
	onSearch: () => void
}

export function ShellRail({
	className,
	user,
	onAddTask,
	onExpand,
	onSearch,
}: Readonly<ShellRailProps>) {
	return (
		<SidebarRail
			aria-label="Sidebar"
			className={cn('fixed inset-y-0 left-0 z-20 desktop:pt-8', className)}
		>
			<DesktopDragRegion />

			{/* The name is text, not an attribute, so session replay can mask it. */}
			<button
				className={sidebarRailItemVariants()}
				onClick={onExpand}
				type="button"
			>
				<Avatar className="ph-no-capture" name={user.name} src={user.image} />
				<span className="ph-mask sr-only">
					{user.name}, open the account menu
				</span>
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
				<RailNavLink icon={Inbox} label="Inbox" to={APP_PATHS.inbox} />

				<RailNavLink
					icon={CalendarDays}
					label="Upcoming"
					to={APP_PATHS.upcoming}
				/>

				<RailNavLink icon={CalendarFold} label="Today" to={APP_PATHS.today} />

				<button
					aria-label="Search"
					className={sidebarRailItemVariants()}
					onClick={onSearch}
					title="Search"
					type="button"
				>
					<Search aria-hidden />
				</button>
			</nav>

			<button
				aria-label="Projects"
				className={sidebarRailItemVariants()}
				onClick={onExpand}
				title="Projects"
				type="button"
			>
				<Hash aria-hidden />
			</button>

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
