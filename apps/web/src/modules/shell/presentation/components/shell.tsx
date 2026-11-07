import type { SessionUser } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Button } from '@soonlane/ui/components/button'
import { Toaster } from '@soonlane/ui/components/toaster'
import { PanelLeftOpen } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import type { ClientEvents } from '@/modules/analytics/domain/analytics-event.types'
import { capture } from '@/modules/analytics/presentation/analytics.client'
import { AddTaskDialog } from '@/modules/tasks/presentation/components/task/add-task-dialog'
import {
	isWideViewport,
	saveSidebarPreference,
} from '../helpers/sidebar-preference.helper'
import type { SidebarPreference } from '../sidebar-preference.types'
import { DesktopDragRegion } from './desktop-drag-region'
import { ShellRail } from './shell-rail'
import { ShellSidebar } from './shell-sidebar'

interface ShellProps extends PropsWithChildren {
	activeLabelName?: string
	initialSidebarPreference: SidebarPreference
	user: SessionUser
}

/**
 * Phones: the sidebar is a drawer. From md: an icon rail is always docked
 * and the content keeps a fixed rail-wide gutter, so expanding never moves
 * the centered column. From xl: the owner's choice (full or rail) is docked
 * and remembered; below xl the full sidebar opens over the content.
 */
export function Shell({
	activeLabelName,
	children,
	initialSidebarPreference,
	user,
}: Readonly<ShellProps>) {
	const [preference, setPreference] = useState(initialSidebarPreference)
	const [isOverlayOpen, setIsOverlayOpen] = useState(false)
	const [isAddingTask, setIsAddingTask] = useState(false)

	function openAddTask() {
		setIsOverlayOpen(false)
		setIsAddingTask(true)
		capture('composer_opened', { source: 'sidebar_dialog' })
	}

	function changePreference(next: SidebarPreference) {
		setPreference(next)
		void saveSidebarPreference(next)
	}

	function toggleSidebar(state: ClientEvents['sidebar_toggled']['state']) {
		const isDocked = isWideViewport()

		capture('sidebar_toggled', { state, mode: isDocked ? 'docked' : 'overlay' })
		if (isDocked) changePreference(state === 'expanded' ? 'full' : 'rail')
		else setIsOverlayOpen(state === 'expanded')
	}

	return (
		<div className="min-h-dvh md:pl-14">
			<ShellRail
				className={cn('hidden md:flex', preference === 'full' && 'xl:hidden')}
				onAddTask={openAddTask}
				onExpand={() => toggleSidebar('expanded')}
				user={user}
			/>

			{isOverlayOpen && (
				<button
					aria-label="Close sidebar"
					className="fixed inset-0 z-30 cursor-default bg-black/60 xl:hidden"
					onClick={() => toggleSidebar('collapsed')}
					type="button"
				/>
			)}

			<ShellSidebar
				activeLabelName={activeLabelName}
				className={cn(
					isOverlayOpen ? 'flex' : 'hidden',
					preference === 'full' ? 'xl:flex' : 'xl:hidden'
				)}
				onAddTask={openAddTask}
				onCollapse={() => toggleSidebar('collapsed')}
				onNavigate={() => setIsOverlayOpen(false)}
				user={user}
			/>

			<div className="relative flex h-12 items-center px-3 md:hidden desktop:pl-20">
				<DesktopDragRegion className="w-20" />

				<Button
					aria-label="Open sidebar"
					onClick={() => toggleSidebar('expanded')}
					size="icon"
					variant="ghost"
				>
					<PanelLeftOpen />
				</Button>
			</div>

			{children}

			{isAddingTask && <AddTaskDialog onClose={() => setIsAddingTask(false)} />}

			<Toaster />
		</div>
	)
}
