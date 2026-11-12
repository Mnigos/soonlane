import { Dialog } from '@soonlane/ui/components/dialog'
import { Kbd } from '@soonlane/ui/components/kbd'
import { Fragment } from 'react'
import {
	KEYBOARD_SHORTCUT_GROUPS,
	MOD_KEY,
} from '../keyboard-shortcuts.constants'

interface KeyboardShortcutsDialogProps {
	onClose: () => void
}

/** Opens only from a key press or a click, never in the server render, so it can read the platform for the ⌘ or Ctrl key. */
export function KeyboardShortcutsDialog({
	onClose,
}: Readonly<KeyboardShortcutsDialogProps>) {
	const modKey = /Mac|iPhone|iPad/u.test(navigator.userAgent) ? '⌘' : 'Ctrl'

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

								<dd className="flex items-center gap-1">
									{shortcut.keys.map((key, index) => (
										<Fragment key={key}>
											{index > 0 && shortcut.joiner && (
												<span className="px-0.5 text-caption text-muted-foreground">
													{shortcut.joiner}
												</span>
											)}

											<Kbd>{key === MOD_KEY ? modKey : key}</Kbd>
										</Fragment>
									))}
								</dd>
							</div>
						))}
					</dl>
				</section>
			))}
		</Dialog>
	)
}
