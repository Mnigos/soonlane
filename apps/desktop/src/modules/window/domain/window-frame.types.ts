import type { WindowFrame } from './window-frame.schemas'

/** A display's work area (without the menu bar and the Dock) in screen points. */
export interface ScreenArea {
	x: number
	y: number
	width: number
	height: number
}

/** The frame a window opens with: a saved one, or only a size that the system centers. */
export type InitialFrame = Pick<WindowFrame, 'width' | 'height'> &
	Partial<Pick<WindowFrame, 'x' | 'y'>>
