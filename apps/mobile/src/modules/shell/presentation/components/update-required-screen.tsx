import { Linking, Platform, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, TEXT } from '@/tokens.gen'
import { showToast } from '../toast.client'
import { UPDATE_COPY } from '../update-copy.constants'
import { OutlineButton } from './outline-button'

/** TestFlight is the only way to install Soonlane on an iPhone until the App Store release; Android has no store yet. */
const TESTFLIGHT_URL = 'itms-beta://'

/** Shown instead of every screen when the API no longer serves this version of the app. */
export function UpdateRequiredScreen() {
	return (
		<SafeAreaView style={styles.screen}>
			<Text accessibilityRole="header" style={styles.title}>
				{UPDATE_COPY.title}
			</Text>

			<Text style={styles.body}>{UPDATE_COPY.body}</Text>

			{Platform.OS === 'ios' && (
				<OutlineButton
					onPress={() =>
						void Linking.openURL(TESTFLIGHT_URL).catch(() =>
							showToast(UPDATE_COPY.openFailed)
						)
					}
				>
					{UPDATE_COPY.openTestFlight}
				</OutlineButton>
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: 'center',
		gap: 4,
		paddingHorizontal: 24,
		backgroundColor: COLORS.background,
	},
	title: { ...TEXT.xl, fontWeight: '700', color: COLORS.foreground },
	body: { ...TEXT.sm, marginBottom: 16, color: COLORS.mutedForeground },
})
