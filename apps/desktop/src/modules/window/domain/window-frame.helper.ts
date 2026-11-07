import { Option, Schema } from 'effect'
import { frameEventSchema, type WindowFrame } from './window-frame.schemas'
import type { InitialFrame, ScreenArea } from './window-frame.types'
import { DEFAULT_WINDOW_SIZE, MIN_VISIBLE_PX } from './window.constants'

const decodeFrameEvent = Schema.decodeUnknownOption(frameEventSchema)

function overlap(
	start: number,
	length: number,
	areaStart: number,
	areaLength: number
) {
	return (
		Math.min(start + length, areaStart + areaLength) -
		Math.max(start, areaStart)
	)
}

function isOnSomeDisplay(frame: WindowFrame, workAreas: readonly ScreenArea[]) {
	return workAreas.some(
		area =>
			overlap(frame.x, frame.width, area.x, area.width) >= MIN_VISIBLE_PX &&
			overlap(frame.y, frame.height, area.y, area.height) >= MIN_VISIBLE_PX
	)
}

export function restoreFrame(
	saved: WindowFrame | undefined,
	workAreas: readonly ScreenArea[]
): InitialFrame {
	return saved && isOnSomeDisplay(saved, workAreas)
		? saved
		: DEFAULT_WINDOW_SIZE
}

export function applyFrameEvent(
	frame: WindowFrame,
	event: unknown
): WindowFrame {
	return Option.match(decodeFrameEvent(event), {
		onNone: () => frame,
		onSome: ({ data }) => ({ ...frame, ...data }),
	})
}
