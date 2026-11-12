import { Button } from '@soonlane/ui/components/button'
import { SidebarSection } from '@soonlane/ui/components/sidebar'
import { Plus } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import type { SidebarSaveCallbacks } from './sidebar-list-row'
import {
	SidebarNameField,
	type SidebarNameFieldOptions,
	type SidebarNameMutation,
} from './sidebar-name-field'

interface SidebarListSectionProps<TItem> {
	heading: string
	addLabel: string
	emptyNote: string
	loadError: string
	newNameLabel: string
	nameField: SidebarNameFieldOptions
	/** Undefined until the list loads. */
	items: TItem[] | undefined
	isError: boolean
	mutation: SidebarNameMutation
	onCreate: (name: string, callbacks: SidebarSaveCallbacks) => void
	children: (item: TItem) => ReactNode
}

const NOTE_CLASS = 'px-2 py-1.5 text-label text-faint-foreground'

/** A collapsible sidebar list whose "+" adds an item inline; the shell keeps it mounted, so its open state survives the switch to the rail. */
export function SidebarListSection<TItem>({
	heading,
	addLabel,
	emptyNote,
	loadError,
	newNameLabel,
	nameField,
	items,
	isError,
	mutation,
	onCreate,
	children,
}: Readonly<SidebarListSectionProps<TItem>>) {
	const [isOpen, setIsOpen] = useState(true)
	const [isAdding, setIsAdding] = useState(false)

	function stopAdding() {
		setIsAdding(false)
		mutation.reset()
	}

	return (
		<SidebarSection
			action={
				<Button
					aria-label={addLabel}
					onClick={() => {
						setIsOpen(true)
						setIsAdding(true)
					}}
					size="icon"
					title={addLabel}
					variant="ghost"
				>
					<Plus />
				</Button>
			}
			isOpen={isOpen}
			label={heading}
			onOpenChange={setIsOpen}
		>
			{items?.length === 0 && <p className={NOTE_CLASS}>{emptyNote}</p>}

			{isError && <p className={NOTE_CLASS}>{loadError}</p>}

			{items && items.length > 0 && (
				<ul className="flex flex-col gap-0.5">{items.map(children)}</ul>
			)}

			{isAdding && (
				<SidebarNameField
					{...nameField}
					label={newNameLabel}
					mutation={mutation}
					onCancel={stopAdding}
					onSave={(name, onSettled) =>
						onCreate(name, { onSuccess: stopAdding, onSettled })
					}
				/>
			)}
		</SidebarSection>
	)
}
