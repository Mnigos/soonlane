/** Stands for ⌘ on Apple devices and Ctrl elsewhere. */
export const MOD_KEY = 'Mod'

interface KeyboardShortcut {
	action: string
	keys: string[]
	/** Shown between the keys of a sequence ("then") or of alternatives ("or"); without one they sit side by side. */
	joiner?: 'then' | 'or'
}

/** The views a "g" sequence opens, which the search palette lists with the same keys. */
export const VIEW_SHORTCUTS = [
	{ view: 'upcoming', name: 'Upcoming', keys: ['G', 'U'] },
	{ view: 'today', name: 'Today', keys: ['G', 'T'] },
] as const

interface KeyboardShortcutGroup {
	title: string
	shortcuts: KeyboardShortcut[]
}

/** The Keyboard shortcuts dialog's list, in its order. */
export const KEYBOARD_SHORTCUT_GROUPS: readonly KeyboardShortcutGroup[] = [
	{
		title: 'General',
		shortcuts: [
			{ action: 'Add task', keys: ['Q'] },
			{ action: 'Open search', keys: [MOD_KEY, 'K'] },
			{ action: 'Show keyboard shortcuts', keys: ['?'] },
		],
	},
	{
		title: 'Navigation',
		shortcuts: VIEW_SHORTCUTS.map(({ name, keys }) => ({
			action: `Go to ${name}`,
			keys: [...keys],
			joiner: 'then',
		})),
	},
	{
		title: 'Task list',
		shortcuts: [
			{ action: 'Select next task', keys: ['J', '↓'], joiner: 'or' },
			{ action: 'Select previous task', keys: ['K', '↑'], joiner: 'or' },
			{ action: 'Complete task', keys: ['E'] },
			{ action: 'Edit task', keys: ['Enter'] },
			{ action: 'Set date', keys: ['T'] },
			{ action: 'Set priority', keys: ['1', '2', '3', '4'] },
			{ action: 'Save task', keys: [MOD_KEY, 'Enter'] },
			{ action: 'Cancel or close', keys: ['Esc'] },
		],
	},
]
