import { Pressable, StyleSheet, Text } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'

interface AddTaskRowProps {
	onPress: () => void
}

/** The web's "+ Add task" row that opens the composer. */
export function AddTaskRow({ onPress }: Readonly<AddTaskRowProps>) {
	return (
		<Pressable
			accessibilityRole="button"
			onPress={onPress}
			style={({ pressed }) => [styles.row, pressed && styles.pressed]}
		>
			<Text style={styles.plus}>+</Text>

			<Text style={styles.label}>Add task</Text>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	row: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
	pressed: { backgroundColor: COLORS.hover },
	plus: { ...TEXT.lg, width: 18, textAlign: 'center', color: COLORS.primary },
	label: { ...TEXT.sm, color: COLORS.mutedForeground },
})
