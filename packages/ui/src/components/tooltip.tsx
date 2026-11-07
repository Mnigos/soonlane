import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip'
import type { ComponentProps, ReactElement, ReactNode } from 'react'

interface TooltipProps {
	label: ReactNode
	children: ReactElement
	side?: ComponentProps<typeof BaseTooltip.Positioner>['side']
}

export function Tooltip({
	label,
	children,
	side = 'top',
}: Readonly<TooltipProps>) {
	return (
		<BaseTooltip.Root>
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
