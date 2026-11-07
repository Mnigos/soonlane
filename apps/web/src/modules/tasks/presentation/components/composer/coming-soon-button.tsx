import { cn } from '@soonlane/ui/cn'
import { Tooltip } from '@soonlane/ui/components/tooltip'
import { type KeyboardEvent, type PropsWithChildren, useId } from 'react'
import { COMING_SOON_CLASS } from '../../helpers/composer-chip.constants'

interface ComingSoonButtonProps extends PropsWithChildren {
	label: string
	/** Id of a masked element whose text completes the name, for user content that must stay out of attributes. */
	labelledBy?: string
	className: string
	onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void
}

/** A Todoist control Soonlist does not have yet: it keeps the layout, does nothing and says "Coming soon". */
export function ComingSoonButton({
	label,
	labelledBy,
	className,
	onKeyDown,
	children,
}: Readonly<ComingSoonButtonProps>) {
	const id = useId()

	return (
		<Tooltip label="Coming soon">
			<button
				aria-disabled
				aria-label={`${label}, coming soon`}
				aria-labelledby={labelledBy && `${id} ${labelledBy}`}
				className={cn(className, COMING_SOON_CLASS)}
				id={id}
				onKeyDown={onKeyDown}
				type="button"
			>
				{children}
			</button>
		</Tooltip>
	)
}
