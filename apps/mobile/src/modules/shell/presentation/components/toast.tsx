import { useSyncExternalStore } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import { getShownToast, hideToast, subscribeToToast } from '../toast.client'

/** Room for the tab bar under the toast. */
const TAB_BAR_CLEARANCE = 64

/** The web's bottom toast: sidebar grey with a hairline, the message, and a coral action such as Undo; a tap hides it. */
export function Toast() {
	const toast = useSyncExternalStore(subscribeToToast, getShownToast)
	const { bottom } = useSafeAreaInsets()

	if (!toast) return null

	const { action } = toast

	return (
		<View
			pointerEvents="box-none"
			style={[styles.viewport, { bottom: bottom + TAB_BAR_CLEARANCE }]}
		>
			<Pressable
				accessibilityLiveRegion="polite"
				accessible={false}
				onPress={hideToast}
				style={styles.toast}
			>
				<Text style={styles.message}>{toast.message}</Text>

				{action && (
					<Pressable
						accessibilityRole="button"
						hitSlop={8}
						onPress={() => {
							hideToast()
							action.onClick()
						}}
						style={({ pressed }) => [styles.action, pressed && styles.pressed]}
					>
						<Text style={styles.actionLabel}>{action.label}</Text>
					</Pressable>
				)}
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	viewport: { position: 'absolute', left: 16, right: 16 },
	toast: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 16,
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.sidebar,
	},
	message: { ...TEXT.sm, flexShrink: 1, color: COLORS.foreground },
	action: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md },
	pressed: { backgroundColor: COLORS.hover },
	actionLabel: { ...TEXT.sm, fontWeight: '600', color: COLORS.danger },
})
