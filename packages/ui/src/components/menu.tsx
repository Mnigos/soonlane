import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../utils/cn.util'

export const Menu = BaseMenu.Root

export const MenuTrigger = BaseMenu.Trigger

export const MenuRadioGroup = BaseMenu.RadioGroup

type MenuContentProps = ComponentProps<typeof BaseMenu.Popup> &
	Pick<ComponentProps<typeof BaseMenu.Positioner>, 'align' | 'side'>

/** The floating list of a menu, portaled to the body and kept inside the viewport. */
export function MenuContent({
	align = 'start',
	side = 'bottom',
	className,
	...props
}: Readonly<MenuContentProps>) {
	return (
		<BaseMenu.Portal>
			<BaseMenu.Positioner
				align={align}
				className="z-50"
				collisionPadding={8}
				side={side}
				sideOffset={4}
			>
				<BaseMenu.Popup
					className={cn(
						'min-w-44 rounded-lg border bg-sidebar p-1 text-foreground shadow-lg outline-none',
						className
					)}
					data-slot="menu-content"
					{...props}
				/>
			</BaseMenu.Positioner>
		</BaseMenu.Portal>
	)
}

const ITEM_CLASS =
	'flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2 text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-hover [&_svg]:size-4 [&_svg]:shrink-0'

/** A radio item that closes the menu when picked and shows a red check while selected. */
export function MenuRadioItem({
	className,
	children,
	...props
}: Readonly<ComponentProps<typeof BaseMenu.RadioItem>>) {
	return (
		<BaseMenu.RadioItem
			className={cn(ITEM_CLASS, className)}
			closeOnClick
			data-slot="menu-radio-item"
			{...props}
		>
			{children}

			<BaseMenu.RadioItemIndicator className="ml-auto text-primary">
				<Check aria-hidden strokeWidth={2.5} />
			</BaseMenu.RadioItemIndicator>
		</BaseMenu.RadioItem>
	)
}
