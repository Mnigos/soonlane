import type { WindowFrame } from './window-frame.schemas'

export interface ScreenArea {
	x: number
	y: number
	width: number
	height: number
}

export type InitialFrame = Pick<WindowFrame, 'width' | 'height'> &
	Partial<Pick<WindowFrame, 'x' | 'y'>>
