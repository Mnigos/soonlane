import type {
	InitialFrame,
	ScreenArea,
} from '../../window/domain/window-frame.types'
import { QUICK_ADD_SIZE, QUICK_ADD_TOP_SHARE } from './quick-add.constants'

interface Display {
	bounds: ScreenArea
	workArea: ScreenArea
}

function contains(area: ScreenArea, point: Pick<ScreenArea, 'x' | 'y'>) {
	return (
		point.x >= area.x &&
		point.x < area.x + area.width &&
		point.y >= area.y &&
		point.y < area.y + area.height
	)
}

/**
 * Like Todoist: centered on the display under the cursor, in the upper part
 * of its work area. Without displays the system centers the window.
 */
export function placeQuickAdd(
	displays: readonly Display[],
	cursor: Pick<ScreenArea, 'x' | 'y'>
): InitialFrame {
	const display =
		displays.find(({ bounds }) => contains(bounds, cursor)) ?? displays[0]

	if (!display) return QUICK_ADD_SIZE

	const { workArea } = display

	return {
		...QUICK_ADD_SIZE,
		x: Math.round(workArea.x + (workArea.width - QUICK_ADD_SIZE.width) / 2),
		y: Math.round(workArea.y + workArea.height * QUICK_ADD_TOP_SHARE),
	}
}
