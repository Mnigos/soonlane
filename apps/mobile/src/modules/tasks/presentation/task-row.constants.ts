import { StyleSheet } from 'react-native'
import { COLORS } from '@/tokens.gen'

/** Lets the 18px circle take a 44px touch. */
export const CIRCLE_HIT_SLOP = 13

/** The row and its 18px circle, shared by open and completed tasks as on the web. */
export const TASK_ROW_STYLES = StyleSheet.create({
	row: {
		flexDirection: 'row',
		gap: 10,
		paddingVertical: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	circle: {
		width: 18,
		height: 18,
		marginTop: 1,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderRadius: 9,
	},
})
