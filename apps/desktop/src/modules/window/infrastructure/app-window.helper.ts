import { BrowserWindow, type WindowOptionsType } from 'electrobun'
import { getNavigationRules } from '../../navigation/domain/navigation.helper'
import { SHELL_PRELOAD } from './shell-preload.constants'

/** A window on the web app, with the shell's preload and the navigation rules that keep it on the app's origin. */
export function openAppWindow(
	appUrl: URL,
	options: Pick<
		WindowOptionsType,
		'title' | 'url' | 'frame' | 'titleBarStyle'
	> &
		Partial<Pick<WindowOptionsType, 'styleMask'>>
) {
	const window = new BrowserWindow({
		...options,
		preload: SHELL_PRELOAD,
		renderer: 'native',
	})

	// Electrobun 2.0.6 ignores the navigationRules window option for the main view, so the rules are set on the view.
	window.webview.setNavigationRules(getNavigationRules(appUrl))

	return window
}
