import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Screen, Utils } from 'electrobun'
import { readField } from './event-payload.helper'

export interface WindowFrame {
	x: number
	y: number
	width: number
	height: number
}

const DEFAULT_SIZE = { width: 1200, height: 800 }
const MIN_VISIBLE_PX = 80
const stateFile = join(Utils.paths.userData, 'window-state.json')

function isFrame(value: unknown): value is WindowFrame {
	return ['x', 'y', 'width', 'height'].every(key =>
		Number.isFinite(readField(value, key))
	)
}

// A frame saved on a display that is gone would open the window off screen.
function isOnSomeDisplay(frame: WindowFrame) {
	return Screen.getAllDisplays().some(({ workArea }) => {
		const overlapX =
			Math.min(frame.x + frame.width, workArea.x + workArea.width) -
			Math.max(frame.x, workArea.x)
		const overlapY =
			Math.min(frame.y + frame.height, workArea.y + workArea.height) -
			Math.max(frame.y, workArea.y)

		return overlapX >= MIN_VISIBLE_PX && overlapY >= MIN_VISIBLE_PX
	})
}

/** The last saved frame when it is still visible, otherwise a centered default size. */
export function loadWindowFrame(): Partial<WindowFrame> & typeof DEFAULT_SIZE {
	try {
		const saved: unknown = JSON.parse(readFileSync(stateFile, 'utf-8'))

		if (isFrame(saved) && isOnSomeDisplay(saved)) return saved
	} catch {
		// First launch or an unreadable file: fall back to the default size.
	}

	return DEFAULT_SIZE
}

export function saveWindowFrame(frame: WindowFrame) {
	mkdirSync(dirname(stateFile), { recursive: true })
	writeFileSync(stateFile, JSON.stringify(frame))
}
