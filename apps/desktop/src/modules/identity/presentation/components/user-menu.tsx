import { CalendarSubscriptionDialog } from '@soonlane/app/calendar/components/calendar-subscription-dialog'
import { LinearMenuItem } from '@soonlane/app/linear/components/linear-menu-item'
import { McpConnectionsDialog } from '@soonlane/app/mcp/components/mcp-connections-dialog'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { LINEAR_CONNECT_PATH, TODOIST_IMPORT_PATH } from '@soonlane/auth'
import type { SessionUser } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Avatar } from '@soonlane/ui/components/avatar'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
	Bot,
	CalendarSync,
	ChevronDown,
	Import,
	Keyboard,
	LogOut,
	Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { desktopHost } from '../../../../platform/rpc/desktop-host.client'
import { SIGN_OUT_FAILED } from '../helpers/sign-out-copy.constants'
import { AccountNotDeletedDialog } from './account-not-deleted-dialog'
import { DeleteAccountDialog } from './delete-account-dialog'

const MENU_ITEM_CLASS =
	'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-hover disabled:opacity-50'
const DELETION_RETURN_KEY = ['desktop', 'deletion-return']
/** The import links Todoist in the browser, which holds the OAuth state cookie and the web session. */
const TODOIST_IMPORT_URL = new URL(TODOIST_IMPORT_PATH, import.meta.env.APP_URL)
/** Linking runs in the browser for the same reason. */
const LINEAR_CONNECT_URL = new URL(LINEAR_CONNECT_PATH, import.meta.env.APP_URL)

interface UserMenuProps {
	user: SessionUser
	onShowShortcuts: () => void
}

/**
 * The web app's user menu. It also opens the deletion dialog again when this
 * page loaded after a fresh sign-in started for it, or says that nothing was
 * deleted when that sign-in landed on another account.
 */
export function UserMenu({ user, onShowShortcuts }: Readonly<UserMenuProps>) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSubscribingCalendar, setIsSubscribingCalendar] = useState(false)
	const [isListingMcpConnections, setIsListingMcpConnections] = useState(false)
	const [isDeletingAccount, setIsDeletingAccount] = useState(false)
	const queryClient = useQueryClient()
	const { data: todoist } = useQuery(orpcQuery.todoist.status.queryOptions())
	// Read once per page: the main process hands the return out only once, and settling it answers null from then on.
	const { data: returnedFor } = useQuery({
		queryKey: DELETION_RETURN_KEY,
		queryFn: desktopHost.takeDeletionReturn,
		staleTime: Number.POSITIVE_INFINITY,
		gcTime: Number.POSITIVE_INFINITY,
	})
	const settleReturn = () => {
		desktopHost.settleDeletionReturn()
		// A read still in flight would otherwise land after this and reopen the closed dialog.
		void queryClient.cancelQueries({ queryKey: DELETION_RETURN_KEY })
		queryClient.setQueryData(DELETION_RETURN_KEY, null)
	}
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

					<button
						className={MENU_ITEM_CLASS}
						onClick={() => setIsListingMcpConnections(true)}
						type="button"
					>
						<Bot aria-hidden className="size-4 text-muted-foreground" />
						Connected agents
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

					<LinearMenuItem
						className={MENU_ITEM_CLASS}
						connectHref={LINEAR_CONNECT_URL.href}
					/>

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

					<button
						className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-danger transition-colors hover:bg-hover"
						onClick={() => setIsDeletingAccount(true)}
						type="button"
					>
						<Trash2 aria-hidden className="size-4" />
						Delete account
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

			{isListingMcpConnections && (
				<McpConnectionsDialog
					onClose={() => setIsListingMcpConnections(false)}
				/>
			)}

			{(isDeletingAccount || returnedFor?.id === user.id) && (
				<DeleteAccountDialog
					account={user}
					onClose={() => {
						setIsDeletingAccount(false)
						settleReturn()
					}}
				/>
			)}

			{returnedFor && returnedFor.id !== user.id && (
				<AccountNotDeletedDialog
					onClose={settleReturn}
					signedInAs={user.email}
					startedFor={returnedFor.email}
				/>
			)}
		</div>
	)
}
