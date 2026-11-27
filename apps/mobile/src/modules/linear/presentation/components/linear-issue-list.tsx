import { LINEAR_COPY } from '@soonlane/app/linear/helpers/linear-copy.constants'
import type { LinearPin } from '@soonlane/contracts'
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'

interface LinearIssueListProps {
	pins: LinearPin[]
}

/** The task's pinned Linear issues as stored, read only: a tap opens the issue in Linear, and pinning stays on the web and Mac. */
export function LinearIssueList({ pins }: Readonly<LinearIssueListProps>) {
	if (pins.length === 0) return null

	return (
		<View>
			<Text accessibilityRole="header" style={styles.heading}>
				{LINEAR_COPY.mobileSection}
			</Text>

			{pins.map(pin => (
				<Pressable
					accessibilityRole="link"
					key={pin.issueId}
					onPress={() => void Linking.openURL(pin.url).catch(() => undefined)}
					style={({ pressed }) => [styles.row, pressed && styles.pressed]}
				>
					<Text style={styles.identifier}>{pin.identifier}</Text>

					<Text numberOfLines={1} style={styles.title}>
						{pin.title}
					</Text>
				</Pressable>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	heading: {
		...TEXT.caption,
		fontWeight: '600',
		marginTop: 16,
		marginBottom: 4,
		color: COLORS.mutedForeground,
	},
	row: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	pressed: { backgroundColor: COLORS.hover },
	identifier: {
		...TEXT.sm,
		minWidth: 72,
		color: COLORS.mutedForeground,
		fontVariant: ['tabular-nums'],
	},
	title: { ...TEXT.sm, flex: 1, color: COLORS.foreground },
})
