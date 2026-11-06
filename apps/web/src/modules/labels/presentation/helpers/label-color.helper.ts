import type { LabelColor } from '@soonlane/domain'
import { LABEL_COLOR_VALUES } from './label-color.constants'

/** A label without a color is drawn in Todoist's default charcoal grey. */
export function getLabelColor(color: LabelColor | undefined) {
	return LABEL_COLOR_VALUES[color ?? 'charcoal']
}
