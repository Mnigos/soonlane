import { PrivacyChoicesButton } from '@soonlane/analytics/components/privacy-choices-button'
import { CONSENT_COPY } from '@soonlane/analytics/consent-copy'
import type { SessionUser } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Avatar } from '@soonlane/ui/components/avatar'
import { useNavigate } from '@tanstack/react-router'
import {
	CalendarSync,
	ChevronDown,
	Keyboard,
	LogOut,
	ShieldCheck,
	Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { CalendarSubscriptionDialog } from '@/modules/calendar/presentation/components/calendar-subscription-dialog'
import { describeFailure } from '@/modules/shell/presentation/helpers/maintenance.helper'
import {
	SIGN_OUT_FAILED,
	useSignOutMutation,
} from '../hooks/use-sign-out-mutation'
import { DeleteAccountDialog } from './delete-account-dialog'

const MENU_ITEM_CLASS =
	'flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-hover disabled:opacity-50'

interface UserMenuProps {
	isDeletingAccount: boolean
	reauthError?: string
	user: SessionUser
	onShowShortcuts: () => void
}

export function UserMenu({
	isDeletingAccount,
	reauthError,
	user,
	onShowShortcuts,
}: Readonly<UserMenuProps>) {
	const [isOpen, setIsOpen] = useState(false)
	const [isSubscribingCalendar, setIsSubscribingCalendar] = useState(false)
	const navigate = useNavigate()
	const { mutate: signOut, isPending, error } = useSignOutMutation()

	function setDeleting(deleteAccount: boolean) {
		void navigate({
			to: '.',
			search: prev => ({
				...prev,
				deleteAccount: deleteAccount || undefined,
				error: undefined,
			}),
			replace: true,
			resetScroll: false,
		})
	}

	return (
		<div className="flex min-w-0 flex-col">
			<button
				aria-controls="user-menu"
				aria-expanded={isOpen}
				className="flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-md px-1 transition-colors hover:bg-hover"
				onClick={() => setIsOpen(open => !open)}
				type="button"
			>
				<Avatar className="ph-no-capture" name={user.name} src={user.image} />
				<span className="ph-mask truncate text-sm font-semibold">
					{user.name}
				</span>
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
					<p className="ph-mask truncate px-2 py-1 text-caption text-muted-foreground">
						{user.email}
					</p>

					<PrivacyChoicesButton className={MENU_ITEM_CLASS}>
						<ShieldCheck aria-hidden className="size-4 text-muted-foreground" />

						{CONSENT_COPY.choicesLink}
					</PrivacyChoicesButton>

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

					{/* Phones have no keyboard to use the shortcuts with. */}
					<button
						className={cn(MENU_ITEM_CLASS, 'pointer-coarse:hidden')}
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
						onClick={() => setDeleting(true)}
						type="button"
					>
						<Trash2 aria-hidden className="size-4" />
						Delete account
					</button>

					{error && (
						<p className="px-2 text-caption text-danger" role="alert">
							{describeFailure(error.cause, SIGN_OUT_FAILED)}
						</p>
					)}
				</div>
			)}

			{isSubscribingCalendar && (
				<CalendarSubscriptionDialog
					onClose={() => setIsSubscribingCalendar(false)}
				/>
			)}

			{isDeletingAccount && (
				<DeleteAccountDialog
					email={user.email}
					onClose={() => setDeleting(false)}
					reauthError={reauthError}
				/>
			)}
		</div>
	)
}
