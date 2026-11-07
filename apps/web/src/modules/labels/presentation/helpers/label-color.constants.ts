import type { LabelColor } from '@soonlane/domain'

export const LABEL_COLOR_CLASSES = {
	'berry-red': 'text-label-berry-red',
	red: 'text-label-red',
	orange: 'text-label-orange',
	yellow: 'text-label-yellow',
	'olive-green': 'text-label-olive-green',
	'lime-green': 'text-label-lime-green',
	green: 'text-label-green',
	'mint-green': 'text-label-mint-green',
	teal: 'text-label-teal',
	'sky-blue': 'text-label-sky-blue',
	'light-blue': 'text-label-light-blue',
	blue: 'text-label-blue',
	grape: 'text-label-grape',
	violet: 'text-label-violet',
	lavender: 'text-label-lavender',
	magenta: 'text-label-magenta',
	salmon: 'text-label-salmon',
	charcoal: 'text-label-charcoal',
	grey: 'text-label-grey',
	taupe: 'text-label-taupe',
} as const satisfies Record<LabelColor, string>
