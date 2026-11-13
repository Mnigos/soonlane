import { StyleSheet } from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'

/** The web's search field look, shared by Search's field and the Browse button that opens it. */
export const SEARCH_FIELD_STYLES = StyleSheet.create({
	field: {
		height: 36,
		justifyContent: 'center',
		paddingHorizontal: 10,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.borderStrong,
		borderRadius: RADIUS.md,
	},
	text: { ...TEXT.sm, color: COLORS.foreground },
})
