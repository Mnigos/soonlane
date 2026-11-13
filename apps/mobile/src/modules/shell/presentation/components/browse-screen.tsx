import { StyleSheet, Text } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'
import { PlaceholderScreen } from './placeholder-screen'
import { TextLink } from './text-link'

export function BrowseScreen() {
	return (
		<PlaceholderScreen
			title="Browse"
			description="Your projects and labels will appear here."
		>
			<Text style={styles.section}>Projects</Text>

			<Text style={styles.section}>Labels</Text>

			<TextLink href="/settings">Settings</TextLink>
		</PlaceholderScreen>
	)
}

const styles = StyleSheet.create({
	section: {
		...TEXT.sm,
		marginTop: 12,
		fontWeight: '600',
		color: COLORS.foreground,
	},
})
