import { APP_PATHS } from '@soonlane/app/app-paths'
import { useHostApp } from '@soonlane/app/hooks/use-host-app'
import type { ListedLabel } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'
import {
	Menu,
	MenuContent,
	MenuItem,
	MenuTrigger,
} from '@soonlane/ui/components/menu'
import { sidebarItemVariants } from '@soonlane/ui/components/sidebar'
import { Link, useNavigate } from '@tanstack/react-router'
import { Ellipsis, Pencil, Tag, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { LABEL_COLOR_CLASSES } from '../helpers/label-color.constants'
import { isLabelNamed } from '../helpers/label-name.helper'
import { useUpdateLabelMutation } from '../hooks/use-update-label-mutation'
import { DeleteLabelDialog } from './delete-label-dialog'
import { LabelColorSubmenu } from './label-color-submenu'
import { LabelNameField } from './label-name-field'

interface SidebarLabelRowProps {
	activeLabelName?: string
	label: ListedLabel
	onNavigate: () => void
}

/** Touch screens always show the "…" button beside the count. */
const LINK_CLASS = 'pr-2 [&_svg]:size-4 pointer-coarse:pr-9'

export function SidebarLabelRow({
	activeLabelName,
	label,
	onNavigate,
}: Readonly<SidebarLabelRowProps>) {
	const [isRenaming, setIsRenaming] = useState(false)
	const [isDeleting, setIsDeleting] = useState(false)
	const updateLabel = useUpdateLabelMutation()
	const navigate = useNavigate()
	const { homePath } = useHostApp()
	const nameId = useId()
	const actionsId = useId()
	const isViewOpen = isLabelNamed(label, activeLabelName)

	function stopRenaming() {
		setIsRenaming(false)
		updateLabel.reset()
	}

	function rename(name: string, onSettled: () => void) {
		if (name === label.name) {
			onSettled()
			stopRenaming()
			return
		}

		updateLabel.mutate(
			{ id: label.id, name },
			{
				onSuccess: () => {
					stopRenaming()
					if (isViewOpen)
						void navigate({
							to: APP_PATHS.label,
							params: { name },
							replace: true,
						})
				},
				onSettled,
			}
		)
	}

	if (isRenaming)
		return (
			<li>
				<LabelNameField
					color={label.color}
					defaultValue={label.name}
					label={`Rename ${label.name}`}
					mutation={updateLabel}
					onCancel={stopRenaming}
					onSave={rename}
				/>
			</li>
		)

	return (
		<li className="group/label relative">
			<Link
				activeProps={{
					className: cn(sidebarItemVariants({ state: 'active' }), LINK_CLASS),
				}}
				inactiveProps={{
					className: cn(sidebarItemVariants({ state: 'inactive' }), LINK_CLASS),
				}}
				onClick={onNavigate}
				params={{ name: label.name }}
				to={APP_PATHS.label}
			>
				<Tag
					aria-hidden
					className={LABEL_COLOR_CLASSES[label.color ?? 'charcoal']}
				/>

				<span className="ph-mask truncate" id={nameId}>
					{label.name}
				</span>

				{label.openTaskCount > 0 && (
					<span className="ml-auto text-caption text-muted-foreground pointer-fine:group-focus-within/label:invisible pointer-fine:group-hover/label:invisible pointer-fine:group-has-data-popup-open/label:invisible">
						{label.openTaskCount}
					</span>
				)}
			</Link>

			<Menu>
				<MenuTrigger
					aria-label="More actions for"
					aria-labelledby={`${actionsId} ${nameId}`}
					className="absolute top-1 right-1 flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-colors group-focus-within/label:opacity-100 group-hover/label:opacity-100 hover:bg-hover hover:text-foreground data-popup-open:opacity-100 pointer-coarse:opacity-100"
					id={actionsId}
				>
					<Ellipsis aria-hidden className="size-4" />
				</MenuTrigger>

				<MenuContent align="start" className="w-40 py-1" side="right">
					<MenuItem onClick={() => setIsRenaming(true)}>
						<Pencil aria-hidden className="size-4" />
						Rename
					</MenuItem>

					<LabelColorSubmenu label={label} />

					<MenuItem className="text-danger" onClick={() => setIsDeleting(true)}>
						<Trash2 aria-hidden className="size-4" />
						Delete
					</MenuItem>
				</MenuContent>
			</Menu>

			{isDeleting && (
				<DeleteLabelDialog
					label={label}
					onClose={() => setIsDeleting(false)}
					onDeleted={() => {
						setIsDeleting(false)
						if (isViewOpen) void navigate({ to: homePath })
					}}
				/>
			)}
		</li>
	)
}
