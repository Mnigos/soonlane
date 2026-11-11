import { Menu as BaseMenu } from '@base-ui/react/menu'
import { Check, ChevronRight } from 'lucide-react'
import type { ComponentProps, KeyboardEvent } from 'react'
import { cn } from '../utils/cn.util'

export const Menu = BaseMenu.Root
export const MenuTrigger = BaseMenu.Trigger
export const MenuRadioGroup = BaseMenu.RadioGroup
export const MenuSubmenu = BaseMenu.SubmenuRoot
export const MenuGroup = BaseMenu.Group

type MenuContentProps = ComponentProps<typeof BaseMenu.Popup> &
	Pick<ComponentProps<typeof BaseMenu.Positioner>, 'align' | 'side'>

/** The floating list of a menu, centered under its trigger like Todoist's, portaled and kept inside the viewport, scrolling when taller than the room left. */
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
						'max-h-(--available-height) overflow-y-auto rounded-lg border bg-popover text-secondary-foreground shadow-lg outline-none',
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

/** A row that opens a submenu, marked by a chevron and kept on the hover grey while its submenu is open. */
export function MenuSubmenuTrigger({
	className,
	children,
	...props
}: Readonly<ComponentProps<typeof BaseMenu.SubmenuTrigger>>) {
	return (
		<BaseMenu.SubmenuTrigger
			className={cn(ITEM_CLASS, 'data-popup-open:bg-hover', className)}
			data-slot="menu-submenu-trigger"
			{...props}
		>
			{children}

			<ChevronRight aria-hidden className="ml-auto size-4" />
		</BaseMenu.SubmenuTrigger>
	)
}

/** A small bold heading over a group of items, such as the row of choices under "Date". */
export function MenuGroupLabel({
	className,
	...props
}: Readonly<ComponentProps<typeof BaseMenu.GroupLabel>>) {
	return (
		<BaseMenu.GroupLabel
			className={cn(
				'px-2 pt-1.5 pb-1 text-label font-semibold text-foreground',
				className
			)}
			data-slot="menu-group-label"
			{...props}
		/>
	)
}

/** A hairline between groups of items. */
export function MenuSeparator({
	className,
	...props
}: Readonly<ComponentProps<typeof BaseMenu.Separator>>) {
	return (
		<BaseMenu.Separator
			className={cn('my-1 h-px bg-border', className)}
			data-slot="menu-separator"
			{...props}
		/>
	)
}

const ICON_ITEM_CLASS =
	'flex size-8 cursor-pointer items-center justify-center rounded-md border border-transparent outline-none select-none data-highlighted:bg-hover [&_svg]:shrink-0'

/** A square item holding only an icon, for a row of quick choices; it needs an `aria-label`. */
export function MenuIconItem({
	className,
	...props
}: Readonly<ComponentProps<typeof BaseMenu.Item>>) {
	return (
		<BaseMenu.Item
			className={cn(ICON_ITEM_CLASS, className)}
			data-slot="menu-icon-item"
			{...props}
		/>
	)
}

/** An icon-only radio item that closes the menu when picked; the selected one is framed, like Todoist's current priority. */
export function MenuIconRadioItem({
	className,
	...props
}: Readonly<ComponentProps<typeof BaseMenu.RadioItem>>) {
	return (
		<BaseMenu.RadioItem
			className={cn(
				ICON_ITEM_CLASS,
				'data-checked:border-border-strong',
				className
			)}
			closeOnClick
			data-slot="menu-icon-radio-item"
			{...props}
		/>
	)
}

/** Moves focus to the item beside the focused one, mirrored in right-to-left text; the menu's highlight follows focus. */
function moveAlongRow(event: KeyboardEvent<HTMLElement>) {
	if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return

	const items = [
		...event.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]'),
	]
	const focused = document.activeElement

	if (!(focused instanceof HTMLElement)) return

	const index = items.indexOf(focused)
	const isForward =
		(event.key === 'ArrowRight') !==
		(getComputedStyle(event.currentTarget).direction === 'rtl')
	const next = items[index + (isForward ? 1 : -1)]

	if (index === -1 || !next) return

	event.preventDefault()
	next.focus()
}

/** Items side by side: Left and Right move along the row, Up and Down keep the menu's order through every item. */
export function MenuRow({
	className,
	onKeyDown,
	...props
}: Readonly<ComponentProps<'div'>>) {
	return (
		<div
			className={cn('flex items-center gap-3 px-2 pb-1', className)}
			role="none"
			data-slot="menu-row"
			onKeyDown={event => {
				onKeyDown?.(event)
				moveAlongRow(event)
			}}
			{...props}
		/>
	)
}
