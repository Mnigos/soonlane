import { Dialog } from '@soonlane/ui/components/dialog'
import { KEYBOARD_SHORTCUT_GROUPS } from '../keyboard-shortcuts.constants'
import { ShortcutKeys } from './shortcut-keys'

interface KeyboardShortcutsDialogProps {
	onClose: () => void
}

export function KeyboardShortcutsDialog({
	onClose,
}: Readonly<KeyboardShortcutsDialogProps>) {
	return (
		<Dialog
			className="max-h-[calc(100dvh-2rem)] max-w-md overflow-y-auto p-4"
			label="Keyboard shortcuts"
			onClose={onClose}
		>
			<h2 className="text-base font-semibold">Keyboard shortcuts</h2>

			{KEYBOARD_SHORTCUT_GROUPS.map(group => (
				<section className="mt-4" key={group.title}>
					<h3 className="text-label font-semibold text-muted-foreground">
						{group.title}
					</h3>

					<dl className="mt-1">
						{group.shortcuts.map(shortcut => (
							<div
								className="flex h-8 items-center justify-between gap-4 text-sm"
								key={shortcut.action}
							>
								<dt>{shortcut.action}</dt>

								<dd>
									<ShortcutKeys joiner={shortcut.joiner} keys={shortcut.keys} />
								</dd>
							</div>
						))}
					</dl>
				</section>
			))}
		</Dialog>
	)
}
