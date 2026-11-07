import { Popover as BasePopover } from '@base-ui/react/popover'
import type { ComponentProps } from 'react'
import { cn } from '../utils/cn.util'

export const Popover = BasePopover.Root
export const PopoverTrigger = BasePopover.Trigger

type PopoverContentProps = ComponentProps<typeof BasePopover.Popup> &
	Pick<
		ComponentProps<typeof BasePopover.Positioner>,
		'align' | 'side' | 'sideOffset'
	>

export function PopoverContent({
	align = 'start',
	side = 'bottom',
	sideOffset = 4,
	className,
	...props
}: Readonly<PopoverContentProps>) {
	return (
		<BasePopover.Portal>
			<BasePopover.Positioner
				align={align}
				className="z-50"
				collisionPadding={8}
				side={side}
				sideOffset={sideOffset}
			>
				<BasePopover.Popup
					className={cn(
						'max-h-(--available-height) overflow-y-auto rounded-lg border bg-popover text-foreground shadow-lg outline-none',
						className
					)}
					data-slot="popover-content"
					{...props}
				/>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	)
}
