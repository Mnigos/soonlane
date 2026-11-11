import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import type { ComponentProps, ReactElement, ReactNode } from 'react'

interface TooltipProps {
	label: ReactNode
	/** The trigger; it gets the hover and focus handlers. */
	children: ReactElement
	side?: ComponentProps<typeof BaseTooltip.Positioner>['side']
	/** Escape also reaches what holds the trigger (an open menu closes with its tooltip) instead of stopping at the tooltip. */
	sharesEscape?: boolean
}

/** A short dark hint above its trigger on hover or keyboard focus, like Todoist's. */
export function Tooltip({
	label,
	children,
	side = 'top',
	sharesEscape = false,
}: Readonly<TooltipProps>) {
	return (
		<BaseTooltip.Root
			onOpenChange={(_open, details) => {
				if (sharesEscape && details.reason === 'escape-key')
					details.allowPropagation()
			}}
		>
			<BaseTooltip.Trigger delay={300} render={children} />

			<BaseTooltip.Portal>
				<BaseTooltip.Positioner
					className="z-50"
					collisionPadding={8}
					side={side}
					sideOffset={6}
				>
					<BaseTooltip.Popup
						className="rounded-md bg-tooltip px-2 py-0.5 text-sm text-foreground shadow-lg"
						data-slot="tooltip"
					>
						{label}
					</BaseTooltip.Popup>
				</BaseTooltip.Positioner>
			</BaseTooltip.Portal>
		</BaseTooltip.Root>
	)
}
