import type { PropsWithChildren } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'

interface ComposerChipProps extends PropsWithChildren {
	accessibilityLabel: string
	onPress: () => void
	/** Stands in for the web chip's colored icon, e.g. the due tone or the priority's flag. */
	color?: string
	isOpen?: boolean
}

/** DESIGN.md's 28px outlined composer chip (date, priority, labels), in chalk unless it carries a color. */
export function ComposerChip({
	accessibilityLabel,
	onPress,
	color = COLORS.secondaryForeground,
	isOpen = false,
	children,
}: Readonly<ComposerChipProps>) {
	return (
		<Pressable
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="button"
			accessibilityState={{ expanded: isOpen }}
			hitSlop={8}
			onPress={onPress}
			style={({ pressed }) => [
				styles.chip,
				(pressed || isOpen) && styles.pressed,
			]}
		>
			<Text numberOfLines={1} style={[styles.label, { color }]}>
				{children}
			</Text>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	chip: {
		height: 28,
		maxWidth: 160,
		justifyContent: 'center',
		paddingHorizontal: 6,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
	},
	pressed: { backgroundColor: COLORS.hover },
	label: { ...TEXT.label },
})
