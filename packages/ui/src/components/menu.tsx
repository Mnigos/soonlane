import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '../utils/cn.util'

export const Menu = BaseMenu.Root

export const MenuTrigger = BaseMenu.Trigger

export const MenuRadioGroup = BaseMenu.RadioGroup

type MenuContentProps = ComponentProps<typeof BaseMenu.Popup> &
	Pick<ComponentProps<typeof BaseMenu.Positioner>, 'align' | 'side'>

/** The floating list of a menu, centered under its trigger like Todoist's, portaled and kept inside the viewport. */
export function MenuContent({
	align = 'center',
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
				sideOffset={3}
			>
				<BaseMenu.Popup
					className={cn(
						'overflow-hidden rounded-lg border bg-popover text-secondary-foreground shadow-lg outline-none',
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
	'flex h-8 cursor-pointer items-center gap-3 pr-1.75 pl-2 text-label outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-checked:bg-hover data-highlighted:bg-hover [&_svg]:shrink-0'

export function MenuItem({
	className,
	...props
}: Readonly<ComponentProps<typeof BaseMenu.Item>>) {
	return (
		<BaseMenu.Item
			className={cn(ITEM_CLASS, className)}
			data-slot="menu-item"
			{...props}
		/>
	)
}

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
				<Check aria-hidden className="size-4" strokeWidth={2.5} />
			</BaseMenu.RadioItemIndicator>
		</BaseMenu.RadioItem>
	)
}
