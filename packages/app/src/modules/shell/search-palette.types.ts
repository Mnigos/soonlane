import type { Label, Task } from '@soonlane/contracts'
import type { VIEW_SHORTCUTS } from './keyboard-shortcuts.constants'

/** A row of the search palette; `all` opens the Search page with the typed query. */
export type PaletteItem =
	| { kind: 'view'; view: (typeof VIEW_SHORTCUTS)[number] }
	| { kind: 'label'; label: Label }
	| { kind: 'task'; task: Task }
	| { kind: 'all' }

export interface PaletteGroup {
	heading?: 'Recent' | 'Navigation' | 'Tasks'
	items: PaletteItem[]
}
