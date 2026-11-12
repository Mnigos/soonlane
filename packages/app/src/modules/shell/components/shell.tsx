import type { ClientEvents } from '@soonlane/analytics'
import { capture } from '@soonlane/analytics/client'
import type { SessionUser, Task } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Button } from '@soonlane/ui/components/button'
import { Toaster } from '@soonlane/ui/components/toaster'
import { PanelLeftOpen } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import { AddTaskDialog } from '../../tasks/components/task/add-task-dialog'
import { EditTaskDialog } from '../../tasks/components/task/edit-task-dialog'
import { useDockBadgeQuery } from '../../tasks/hooks/use-dock-badge-query'
import {
	isWideViewport,
	saveSidebarPreference,
} from '../helpers/sidebar-preference.helper'
import { useKeyboardShortcuts } from '../hooks/use-keyboard-shortcuts'
import { useTrackRecentViews } from '../hooks/use-track-recent-views'
import type { SidebarPreference } from '../sidebar-preference.types'
import { DesktopDragRegion } from './desktop-drag-region'
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'
import { SearchPalette } from './search-palette'
import { ShellRail } from './shell-rail'
import { ShellSidebar } from './shell-sidebar'

interface ShellProps extends PropsWithChildren {
	/** The current pathname, which Recent compares with `APP_PATHS`. */
	activePath: string
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
	activePath,
	activeLabelName,
	children,
	initialSidebarPreference,
	user,
}: Readonly<ShellProps>) {
	const [preference, setPreference] = useState(initialSidebarPreference)
	const [isOverlayOpen, setIsOverlayOpen] = useState(false)
	const [isAddingTask, setIsAddingTask] = useState(false)
	const [isShowingShortcuts, setIsShowingShortcuts] = useState(false)
	const [isSearching, setIsSearching] = useState(false)
	const [editedTask, setEditedTask] = useState<Task>()
	const showShortcuts = () => setIsShowingShortcuts(true)

	useDockBadgeQuery()
	useTrackRecentViews(activePath, activeLabelName)
	useKeyboardShortcuts({
		onAddTask: openAddTask,
		onOpenSearch: openSearch,
		onShowShortcuts: showShortcuts,
	})

	function openAddTask() {
		setIsOverlayOpen(false)
		setIsAddingTask(true)
		capture('composer_opened', { source: 'sidebar_dialog' })
	}

	function openSearch() {
		setIsOverlayOpen(false)
		setIsSearching(true)
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
				onSearch={openSearch}
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
				onSearch={openSearch}
				onShowShortcuts={showShortcuts}
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

			{isShowingShortcuts && (
				<KeyboardShortcutsDialog onClose={() => setIsShowingShortcuts(false)} />
			)}

			{isSearching && (
				<SearchPalette
					onClose={() => setIsSearching(false)}
					onEditTask={task => {
						setIsSearching(false)
						setEditedTask(task)
					}}
				/>
			)}

			{editedTask && (
				<EditTaskDialog
					onClose={() => setEditedTask(undefined)}
					task={editedTask}
				/>
			)}

			<Toaster />
		</div>
	)
}
