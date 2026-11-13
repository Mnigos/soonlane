import type { DueTone, LabelColor, TaskPriority } from '@soonlane/domain'
import { COLORS } from '@/tokens.gen'

/** The completion circle's line; P1 to P3 also get a 15% tint fill, P4 none (DESIGN.md). */
export const PRIORITY_COLORS = {
	1: COLORS.priority1,
	2: COLORS.priority2,
	3: COLORS.priority3,
	4: COLORS.priority4,
} as const satisfies Record<TaskPriority, string>

export const DUE_TONE_COLORS = {
	overdue: COLORS.danger,
	today: COLORS.dueToday,
	tomorrow: COLORS.dueTomorrow,
	week: COLORS.dueWeek,
	later: COLORS.mutedForeground,
} as const satisfies Record<DueTone, string>

export const LABEL_COLORS = {
	'berry-red': COLORS.labelBerryRed,
	red: COLORS.labelRed,
	orange: COLORS.labelOrange,
	yellow: COLORS.labelYellow,
	'olive-green': COLORS.labelOliveGreen,
	'lime-green': COLORS.labelLimeGreen,
	green: COLORS.labelGreen,
	'mint-green': COLORS.labelMintGreen,
	teal: COLORS.labelTeal,
	'sky-blue': COLORS.labelSkyBlue,
	'light-blue': COLORS.labelLightBlue,
	blue: COLORS.labelBlue,
	grape: COLORS.labelGrape,
	violet: COLORS.labelViolet,
	lavender: COLORS.labelLavender,
	magenta: COLORS.labelMagenta,
	salmon: COLORS.labelSalmon,
	charcoal: COLORS.labelCharcoal,
	grey: COLORS.labelGrey,
	taupe: COLORS.labelTaupe,
} as const satisfies Record<LabelColor, string>
