import type { ApplicationMenuItemConfig } from 'electrobun'
import { QUICK_ADD_SHORTCUT } from '../../quick-add/domain/quick-add.constants'
import { QUICK_ADD_ACTION, RELOAD_ACTION } from '../domain/menu.constants'

export const APP_MENU = [
	{
		label: 'Soonlane',
		submenu: [
			{ role: 'about' },
			{ type: 'separator' },
			{ role: 'hide' },
			{ role: 'hideOthers' },
			{ role: 'showAll' },
			{ type: 'separator' },
			{ role: 'quit' },
		],
	},
	{
		label: 'File',
		submenu: [
			// Electrobun's global monitor never sees ⌥Space while Soonlane is in front; this key equivalent does.
			{
				label: 'Quick Add',
				action: QUICK_ADD_ACTION,
				accelerator: QUICK_ADD_SHORTCUT,
			},
		],
	},
	{
		label: 'Edit',
		submenu: [
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			{ role: 'pasteAndMatchStyle' },
			{ role: 'delete' },
			{ role: 'selectAll' },
		],
	},
	{
		label: 'View',
		submenu: [
			{ label: 'Reload', action: RELOAD_ACTION, accelerator: 'r' },
			{ type: 'separator' },
			{ role: 'toggleFullScreen' },
		],
	},
	{
		label: 'Window',
		submenu: [
			{ role: 'minimize' },
			{ role: 'zoom' },
			{ role: 'close' },
			{ type: 'separator' },
			{ role: 'bringAllToFront' },
		],
	},
] satisfies ApplicationMenuItemConfig[]
