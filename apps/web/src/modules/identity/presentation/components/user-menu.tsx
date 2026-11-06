import type { SessionUser } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import { Avatar } from '@soonlane/ui/components/avatar'
import { ChevronDown, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useSignOutMutation } from '../hooks/use-sign-out-mutation'

interface UserMenuProps {
	user: SessionUser
}

export function UserMenu({ user }: Readonly<UserMenuProps>) {
	const [isOpen, setIsOpen] = useState(false)
	const { mutate: signOut, isPending, isError } = useSignOutMutation()

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
						className="flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-hover disabled:opacity-50"
						disabled={isPending}
						onClick={() => signOut()}
						type="button"
					>
						<LogOut aria-hidden className="size-4 text-muted-foreground" />
						{isPending ? 'Signing out…' : 'Sign out'}
					</button>

					{isError && (
						<p className="px-2 text-caption text-danger" role="alert">
							Sign-out failed. Try again.
						</p>
					)}
				</div>
			)}
		</div>
	)
}
