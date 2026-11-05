import { cn } from '@soonlist/ui/cn'
import { Button } from '@soonlist/ui/components/button'
import { PanelLeftOpen } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import {
	isWideViewport,
	saveSidebarPreference,
} from '../helpers/sidebar-preference.helper'
import type { SidebarPreference } from '../sidebar-preference.types'
import { ShellRail } from './shell-rail'
import { ShellSidebar } from './shell-sidebar'

interface ShellProps extends PropsWithChildren {
	initialSidebarPreference: SidebarPreference
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
}: Readonly<ShellProps>) {
	const [preference, setPreference] = useState(initialSidebarPreference)
	const [isOverlayOpen, setIsOverlayOpen] = useState(false)

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
				onExpand={expand}
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
				onCollapse={collapse}
				onNavigate={() => setIsOverlayOpen(false)}
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
		</div>
	)
}
