import {
	StyleSheet,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'

interface GoalFieldProps extends TextInputProps {
	label: string
	isInvalid?: boolean
}

/** The web's goal and amount field: a caption over a 32px box whose line turns coral while the value is invalid. */
export function GoalField({
	label,
	isInvalid = false,
	...props
}: Readonly<GoalFieldProps>) {
	return (
		<View style={styles.field}>
			<Text style={styles.label}>{label}</Text>

			<TextInput
				accessibilityLabel={label}
				keyboardAppearance="dark"
				placeholderTextColor={COLORS.faintForeground}
				returnKeyType="done"
				selectionColor={COLORS.primary}
				style={[styles.input, isInvalid && styles.invalid]}
				{...props}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	field: { flex: 1, gap: 4 },
	label: { ...TEXT.caption, color: COLORS.mutedForeground },
	input: {
		...TEXT.label,
		height: 36,
		paddingHorizontal: 10,
		color: COLORS.foreground,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
	},
	invalid: { borderColor: COLORS.danger },
})
