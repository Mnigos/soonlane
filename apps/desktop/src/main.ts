import Electrobun, { ApplicationMenu, BrowserWindow } from 'electrobun'
import { APP_MENU, RELOAD_ACTION } from './app-menu.constants'
import {
	readBlockedNavigationUrl,
	readEventString,
	readField,
	readNewWindowUrl,
} from './event-payload.helper'
import { getNavigationRules, openOutsideApp } from './external-links.helper'
import { SHELL_PRELOAD } from './shell-preload.constants'
import { SHELL_URL } from './shell-url.config'
import { loadWindowFrame, saveWindowFrame } from './window-state.helper'

const SAVE_DELAY_MS = 400

ApplicationMenu.setApplicationMenu(APP_MENU)

const mainWindow = new BrowserWindow({
	title: 'Soonlist',
	url: SHELL_URL.href,
	frame: loadWindowFrame(),
	titleBarStyle: 'hiddenInset',
	preload: SHELL_PRELOAD,
	renderer: 'native',
})
const { webview } = mainWindow

// Electrobun 2.0.6 ignores the navigationRules window option for the main view, so the rules are set on the view.
webview.setNavigationRules(getNavigationRules(SHELL_URL))

let frame = mainWindow.getFrame()
let saveTimer: ReturnType<typeof setTimeout> | undefined

// Resize and move events carry the new frame, so closing never has to read a window that is going away.
function trackFrame(event: unknown) {
	const next = { ...frame }

	for (const key of ['x', 'y', 'width', 'height'] as const) {
		const value = readField(readField(event, 'data'), key)

		if (typeof value === 'number') next[key] = value
	}

	frame = next
	clearTimeout(saveTimer)
	saveTimer = setTimeout(() => saveWindowFrame(frame), SAVE_DELAY_MS)
}

mainWindow.on('resize', trackFrame)
mainWindow.on('move', trackFrame)
mainWindow.on('close', () => {
	clearTimeout(saveTimer)
	saveWindowFrame(frame)
})

// target=_blank, window.open and Cmd+click: other sites go to the system browser, the app stays in this window.
Electrobun.events.on(`new-window-open-${webview.id}`, (event: unknown) => {
	const href = readNewWindowUrl(event)

	if (href && !openOutsideApp(href, SHELL_URL)) webview.loadURL(href)
})

// Navigation rules cancel top-level navigations to other origins (links, redirects, location changes); open them in the system browser.
webview.on('will-navigate', (event: unknown) => {
	const href = readBlockedNavigationUrl(event)

	if (href) openOutsideApp(href, SHELL_URL)
})

ApplicationMenu.on('application-menu-clicked', (event: unknown) => {
	if (readEventString(event, 'action') === RELOAD_ACTION)
		webview.executeJavascript('location.reload()')
})
