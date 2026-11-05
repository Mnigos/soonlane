import { PanelLeftOpen } from 'lucide-react'
import { type PropsWithChildren, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn.util'
import { AppSidebar } from './app-sidebar'
import type { SidebarState } from './sidebar.types'

// 'auto' follows the breakpoint: a drawer closed on phones, a column open on desktop.
const SIDEBAR_CLASSES = {
	auto: 'hidden md:flex',
	open: 'flex',
	closed: 'hidden',
} as const satisfies Record<SidebarState, string>

const OPEN_BUTTON_CLASSES = {
	auto: 'md:hidden',
	open: 'hidden',
	closed: '',
} as const satisfies Record<SidebarState, string>

export function AppShell({ children }: Readonly<PropsWithChildren>) {
	const [sidebarState, setSidebarState] = useState<SidebarState>('auto')

	return (
		<div className="flex min-h-dvh">
			{sidebarState === 'open' && (
				<button
					aria-label="Close sidebar"
					className="fixed inset-0 z-30 cursor-default bg-black/60 md:hidden"
					onClick={() => setSidebarState('auto')}
					type="button"
				/>
			)}
			<AppSidebar
				className={SIDEBAR_CLASSES[sidebarState]}
				onClose={() => setSidebarState('closed')}
				onNavigate={() => setSidebarState('auto')}
			/>
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex h-12 items-center px-3">
					<Button
						aria-label="Open sidebar"
						className={cn(OPEN_BUTTON_CLASSES[sidebarState])}
						onClick={() => setSidebarState('open')}
						size="icon"
						variant="ghost"
					>
						<PanelLeftOpen />
					</Button>
				</div>
				{children}
			</div>
		</div>
	)
}
