import type { SessionUser } from '@soonlist/contracts'
import { cn } from '@soonlist/ui/cn'
import { Button } from '@soonlist/ui/components/button'
import { Toaster } from '@soonlist/ui/components/toaster'
import { PanelLeftOpen } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import { AddTaskDialog } from '@/modules/tasks/presentation/components/task/add-task-dialog'
import {
	isWideViewport,
	saveSidebarPreference,
} from '../helpers/sidebar-preference.helper'
import type { SidebarPreference } from '../sidebar-preference.types'
import { ShellRail } from './shell-rail'
import { ShellSidebar } from './shell-sidebar'

interface ShellProps extends PropsWithChildren {
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
	}

	function changePreference(next: SidebarPreference) {
		setPreference(next)
		void saveSidebarPreference(next)
	}

	function expand() {
		if (isWideViewport()) changePreference('full')
		else setIsOverlayOpen(true)
	}

	function collapse() {
		if (isWideViewport()) changePreference('rail')
		else setIsOverlayOpen(false)
	}

	return (
		<div className="min-h-dvh md:pl-14">
			<ShellRail
				className={cn('hidden md:flex', preference === 'full' && 'xl:hidden')}
				onAddTask={openAddTask}
				onExpand={expand}
				user={user}
			/>

			{isOverlayOpen && (
				<button
					aria-label="Close sidebar"
					className="fixed inset-0 z-30 cursor-default bg-black/60 xl:hidden"
					onClick={() => setIsOverlayOpen(false)}
					type="button"
				/>
			)}

			<ShellSidebar
				className={cn(
					isOverlayOpen ? 'flex' : 'hidden',
					preference === 'full' ? 'xl:flex' : 'xl:hidden'
				)}
				onAddTask={openAddTask}
				onCollapse={collapse}
				onNavigate={() => setIsOverlayOpen(false)}
				user={user}
			/>

			<div className="flex h-12 items-center px-3 md:hidden">
				<Button
					aria-label="Open sidebar"
					onClick={() => setIsOverlayOpen(true)}
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
