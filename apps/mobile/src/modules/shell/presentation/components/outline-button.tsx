import type { PropsWithChildren } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'

interface OutlineButtonProps extends PropsWithChildren {
	onPress: () => void
	disabled?: boolean
	destructive?: boolean
}

/** The web's large outline button: a bordered, transparent row that turns the hover grey while pressed; a destructive one has a danger label. */
export function OutlineButton({
	onPress,
	disabled = false,
	destructive = false,
	children,
}: Readonly<OutlineButtonProps>) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			disabled={disabled}
			onPress={onPress}
			style={({ pressed }) => [
				styles.button,
				pressed && styles.pressed,
				disabled && styles.disabled,
			]}
		>
			<Text style={[styles.label, destructive && styles.destructive]}>
				{children}
			</Text>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	button: {
		height: 44,
		paddingHorizontal: 20,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
	},
	pressed: { backgroundColor: COLORS.hover },
	disabled: { opacity: 0.5 },
	label: { ...TEXT.sm, fontWeight: '500', color: COLORS.foreground },
	destructive: { color: COLORS.danger },
})
