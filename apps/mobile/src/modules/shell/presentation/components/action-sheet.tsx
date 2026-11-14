import { useSyncExternalStore } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import {
	getShownSheet,
	selectInSheet,
	subscribeToSheet,
} from '../action-sheet.client'

/** 60% in hex alpha, the composer's and the web dialog's backdrop. */
const BACKDROP_ALPHA = '99'

/** Android's stand-in for the iOS action sheet: a card of choices above the gesture bar, with Cancel apart from them. */
export function ActionSheet() {
	const sheet = useSyncExternalStore(subscribeToSheet, getShownSheet)
	const { bottom } = useSafeAreaInsets()

	if (!sheet) return null

	const cancelIndex = sheet.options.length - 1

	return (
		<Modal
			animationType="fade"
			onRequestClose={() => selectInSheet(cancelIndex)}
			transparent
			visible
		>
			<Pressable
				accessibilityLabel="Cancel"
				accessibilityRole="button"
				onPress={() => selectInSheet(cancelIndex)}
				style={styles.backdrop}
			/>

			<View style={[styles.sheet, { paddingBottom: 8 + bottom }]}>
				<View style={styles.card}>
					<Text accessibilityRole="header" style={styles.title}>
						{sheet.title}
					</Text>

					{sheet.options.slice(0, cancelIndex).map((option, index) => (
						<Pressable
							accessibilityRole="button"
							key={option}
							onPress={() => selectInSheet(index)}
							style={({ pressed }) => [
								styles.option,
								pressed && styles.pressed,
							]}
						>
							<Text style={styles.label}>{option}</Text>
						</Pressable>
					))}
				</View>

				<Pressable
					accessibilityRole="button"
					onPress={() => selectInSheet(cancelIndex)}
					style={({ pressed }) => [
						styles.card,
						styles.option,
						pressed && styles.pressed,
					]}
				>
					<Text style={[styles.label, styles.cancel]}>
						{sheet.options[cancelIndex]}
					</Text>
				</Pressable>
			</View>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFill,
		backgroundColor: `${COLORS.background}${BACKDROP_ALPHA}`,
	},
	sheet: { flex: 1, justifyContent: 'flex-end', gap: 8, paddingHorizontal: 8 },
	card: {
		overflow: 'hidden',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.sidebar,
	},
	title: {
		...TEXT.caption,
		paddingVertical: 12,
		textAlign: 'center',
		color: COLORS.mutedForeground,
	},
	option: {
		minHeight: 48,
		justifyContent: 'center',
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: COLORS.border,
	},
	pressed: { backgroundColor: COLORS.hover },
	label: { ...TEXT.base, textAlign: 'center', color: COLORS.foreground },
	cancel: { fontWeight: '600' },
})
