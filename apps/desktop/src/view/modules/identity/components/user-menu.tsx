import { CalendarSubscriptionDialog } from '@soonlane/app/calendar/components/calendar-subscription-dialog'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { TODOIST_IMPORT_PATH } from '@soonlane/auth'
import type { SessionUser } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Avatar } from '@soonlane/ui/components/avatar'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
	CalendarSync,
	ChevronDown,
	Import,
	Keyboard,
	LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { desktopHost } from '../../../platform/rpc/desktop-host.client'

const MENU_ITEM_CLASS =
	'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-hover disabled:opacity-50'
const SIGN_OUT_FAILED = 'Sign-out failed. Try again.'
/** The import links Todoist in the browser, which holds the OAuth state cookie and the web session. */
const TODOIST_IMPORT_URL = new URL(TODOIST_IMPORT_PATH, import.meta.env.APP_URL)

interface UserMenuProps {
	user: SessionUser
	onShowShortcuts: () => void
}

/** The web app's user menu without the account actions that need the browser session; those stay on the web. */
export function UserMenu({ user, onShowShortcuts }: Readonly<UserMenuProps>) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSubscribingCalendar, setIsSubscribingCalendar] = useState(false)
	const { data: todoist } = useQuery(orpcQuery.todoist.status.queryOptions())
	const {
		mutate: signOut,
		isPending,
		error,
	} = useMutation({ mutationFn: desktopHost.signOut })

	return (
		<div className="flex min-w-0 flex-col">
			<button
				aria-controls="user-menu"
				aria-expanded={isOpen}
				className="flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-md px-1 transition-colors hover:bg-hover"
				onClick={() => setIsOpen(open => !open)}
				type="button"
			>
				<Avatar name={user.name} src={user.image} />
				<span className="truncate text-sm font-semibold">{user.name}</span>
				<ChevronDown
					aria-hidden
					className={cn(
						'size-4 shrink-0 text-muted-foreground transition-transform',
						isOpen && 'rotate-180'
					)}
				/>
			</button>

			{isOpen && (
				<div className="flex flex-col gap-0.5 py-1" id="user-menu">
					<p className="truncate px-2 py-1 text-caption text-muted-foreground">
						{user.email}
					</p>

					<button
						className={MENU_ITEM_CLASS}
						onClick={() => setIsSubscribingCalendar(true)}
						type="button"
					>
						<CalendarSync
							aria-hidden
							className="size-4 text-muted-foreground"
						/>
						Calendar link
					</button>

					{todoist?.configured && (
						<a
							className={MENU_ITEM_CLASS}
							href={TODOIST_IMPORT_URL.href}
							rel="noopener"
							target="_blank"
						>
							<Import aria-hidden className="size-4 text-muted-foreground" />
							Import from Todoist
						</a>
					)}

					<button
						className={MENU_ITEM_CLASS}
						onClick={onShowShortcuts}
						type="button"
					>
						<Keyboard aria-hidden className="size-4 text-muted-foreground" />
						Keyboard shortcuts
					</button>

					<button
						className={MENU_ITEM_CLASS}
						disabled={isPending}
						onClick={() => signOut()}
						type="button"
					>
						<LogOut aria-hidden className="size-4 text-muted-foreground" />
						{isPending ? 'Signing out…' : 'Sign out'}
					</button>

					{error && (
						<p className="px-2 text-caption text-danger" role="alert">
							{SIGN_OUT_FAILED}
						</p>
					)}
				</div>
			)}

			{isSubscribingCalendar && (
				<CalendarSubscriptionDialog
					onClose={() => setIsSubscribingCalendar(false)}
				/>
			)}
		</div>
	)
}
