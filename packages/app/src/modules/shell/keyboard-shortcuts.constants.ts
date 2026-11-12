/** Stands for ⌘ on Apple devices and Ctrl elsewhere. */
export const MOD_KEY = 'Mod'

interface KeyboardShortcut {
	action: string
	keys: string[]
	/** Shown between the keys of a sequence ("then") or of alternatives ("or"); without one they sit side by side. */
	joiner?: 'then' | 'or'
}

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
			{ action: 'Show keyboard shortcuts', keys: ['?'] },
		],
	},
	{
		title: 'Navigation',
		shortcuts: [
			{ action: 'Go to Upcoming', keys: ['G', 'U'], joiner: 'then' },
			{ action: 'Go to Today', keys: ['G', 'T'], joiner: 'then' },
		],
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
