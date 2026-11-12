import { cn } from '@soonlane/ui/cn'
import {
	Menu,
	MenuContent,
	MenuItem,
	MenuTrigger,
} from '@soonlane/ui/components/menu'
import { sidebarItemVariants } from '@soonlane/ui/components/sidebar'
import { Link, useNavigate } from '@tanstack/react-router'
import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'
import type { APP_PATHS } from '../../../app-path.constants'
import { useHostApp } from '../../../hooks/use-host-app'
import { isNamed } from '../../tasks/helpers/task-view.helper'
import {
	SidebarNameField,
	type SidebarNameFieldOptions,
	type SidebarNameMutation,
} from './sidebar-name-field'

export interface SidebarSaveCallbacks {
	onSuccess: () => void
	onSettled: () => void
}

interface SidebarListRowProps {
	activeName?: string
	item: { name: string; openTaskCount: number }
	to: typeof APP_PATHS.label
	nameField: SidebarNameFieldOptions
	mutation: SidebarNameMutation
	onRename: (name: string, callbacks: SidebarSaveCallbacks) => void
	/** Menu items between Rename and Delete. */
	menuItems?: ReactNode
	renderDeleteDialog: (callbacks: {
		onClose: () => void
		onDeleted: () => void
	}) => ReactNode
	onNavigate: () => void
}

/** Touch screens always show the "…" button beside the count. */
const LINK_CLASS = 'pr-2 [&_svg]:size-4 pointer-coarse:pr-9'

/** A row of a sidebar list: a link to the item's view with its open task count, and a "…" menu to rename or delete it. */
export function SidebarListRow({
	activeName,
	item,
	to,
	nameField,
	mutation,
	onRename,
	menuItems,
	renderDeleteDialog,
	onNavigate,
}: Readonly<SidebarListRowProps>) {
	const [isRenaming, setIsRenaming] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const navigate = useNavigate()
	const { homePath } = useHostApp()
	const nameId = useId()
	const actionsId = useId()
	const isViewOpen = isNamed(item, activeName)
	const Icon = nameField.icon

	function stopRenaming() {
		setIsRenaming(false)
		mutation.reset()
	}

	function rename(name: string, onSettled: () => void) {
		if (name === item.name) {
			onSettled()
			stopRenaming()
			return
		}

		onRename(name, {
			onSuccess: () => {
				stopRenaming()
				if (isViewOpen) void navigate({ to, params: { name }, replace: true })
			},
			onSettled,
		})
	}

	if (isRenaming)
		return (
			<li>
				<SidebarNameField
					{...nameField}
					defaultValue={item.name}
					label={`Rename ${item.name}`}
					mutation={mutation}
					onCancel={stopRenaming}
					onSave={rename}
				/>
			</li>
		)

	return (
		<li className="group/row relative">
			<Link
				activeProps={{
					className: cn(sidebarItemVariants({ state: 'active' }), LINK_CLASS),
				}}
				inactiveProps={{
					className: cn(sidebarItemVariants({ state: 'inactive' }), LINK_CLASS),
				}}
				onClick={onNavigate}
				params={{ name: item.name }}
				to={to}
			>
				<Icon aria-hidden className={nameField.iconClassName} />

				<span className="ph-mask truncate" id={nameId}>
					{item.name}
				</span>

				{item.openTaskCount > 0 && (
					<span className="ml-auto text-caption text-muted-foreground pointer-fine:group-focus-within/row:invisible pointer-fine:group-hover/row:invisible pointer-fine:group-has-data-popup-open/row:invisible">
						{item.openTaskCount}
					</span>
				)}
			</Link>

			<Menu>
				<MenuTrigger
					aria-label="More actions for"
					aria-labelledby={`${actionsId} ${nameId}`}
					className="absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-colors group-focus-within/row:opacity-100 group-hover/row:opacity-100 hover:bg-hover hover:text-foreground data-popup-open:opacity-100 pointer-coarse:opacity-100"
					id={actionsId}
				>
					<Ellipsis aria-hidden className="size-4" />
				</MenuTrigger>

				<MenuContent align="start" className="w-40 py-1" side="right">
					<MenuItem onClick={() => setIsRenaming(true)}>
						<Pencil aria-hidden className="size-4" />
						Rename
					</MenuItem>

					{menuItems}

					<MenuItem className="text-danger" onClick={() => setIsDeleting(true)}>
						<Trash2 aria-hidden className="size-4" />
						Delete
					</MenuItem>
				</MenuContent>
			</Menu>

			{isDeleting &&
				renderDeleteDialog({
					onClose: () => setIsDeleting(false),
					onDeleted: () => {
						setIsDeleting(false)
						if (isViewOpen) void navigate({ to: homePath })
					},
				})}
		</li>
	)
}
