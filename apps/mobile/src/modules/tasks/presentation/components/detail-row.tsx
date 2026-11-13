import type { PropsWithChildren } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'

interface DetailRowProps extends PropsWithChildren {
	label: string
	/** Opens the field's picker; without it the row only holds its own control, like the time field. */
	onPress?: () => void
	isOpen?: boolean
}

/** One field of the task details: its name on the left, its value or control on the right, over a hairline. */
export function DetailRow({
	label,
	onPress,
	isOpen = false,
	children,
}: Readonly<DetailRowProps>) {
	const content = (
		<>
			<Text style={styles.label}>{label}</Text>

			<View style={styles.value}>{children}</View>
		</>
	)

	if (!onPress) return <View style={styles.row}>{content}</View>

	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ expanded: isOpen }}
			onPress={onPress}
			style={({ pressed }) => [
				styles.row,
				(pressed || isOpen) && styles.pressed,
			]}
		>
			{content}
		</Pressable>
	)
}

const styles = StyleSheet.create({
	row: {
		minHeight: 44,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	pressed: { backgroundColor: COLORS.hover },
	label: { ...TEXT.sm, color: COLORS.mutedForeground },
	value: {
		flex: 1,
		flexDirection: 'row',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'flex-end',
		columnGap: 8,
	},
})
