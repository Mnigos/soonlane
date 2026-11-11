import { cn } from '@soonlane/ui/cn'
import { Tooltip } from '@soonlane/ui/components/tooltip'
import type { KeyboardEvent, PropsWithChildren } from 'react'
import { COMING_SOON_CLASS } from '../../helpers/composer-chip.constants'

interface ComingSoonButtonProps extends PropsWithChildren {
	label: string
	className: string
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/** A Todoist control Soonlane does not have yet: it keeps the layout, does nothing and says "Coming soon". */
export function ComingSoonButton({
	label,
	className,
	onKeyDown,
	children,
}: Readonly<ComingSoonButtonProps>) {
	return (
		<Tooltip label="Coming soon">
			<button
				aria-disabled
				aria-label={`${label}, coming soon`}
				className={cn(className, COMING_SOON_CLASS)}
				onKeyDown={onKeyDown}
				type="button"
			>
				{children}
			</button>
		</Tooltip>
	)
}
