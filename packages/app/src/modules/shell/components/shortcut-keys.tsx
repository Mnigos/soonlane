import { Kbd } from '@soonlane/ui/components/kbd'
import { Fragment } from 'react'
import { MOD_KEY } from '../keyboard-shortcuts.constants'

interface ShortcutKeysProps {
	keys: readonly string[]
	joiner?: 'then' | 'or'
}

/** Renders only after a key press or a click, never in the server render, so it can read the platform for the ⌘ or Ctrl key. */
export function ShortcutKeys({ keys, joiner }: Readonly<ShortcutKeysProps>) {
	const modKey = /Mac|iPhone|iPad/u.test(navigator.userAgent) ? '⌘' : 'Ctrl'

	return (
		<span className="flex items-center gap-1">
			{keys.map((key, index) => (
				<Fragment key={key}>
					{index > 0 && joiner && (
						<span className="px-0.5 text-caption text-muted-foreground">
							{joiner}
						</span>
					)}

					<Kbd>{key === MOD_KEY ? modKey : key}</Kbd>
				</Fragment>
			))}
		</span>
	)
}
