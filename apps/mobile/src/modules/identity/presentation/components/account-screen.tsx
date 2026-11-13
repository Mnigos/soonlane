import Constants from 'expo-constants'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authClient } from '@/platform/auth/auth.client'
import { COLORS, TEXT } from '@/tokens.gen'
import { AccountActions } from './account-actions'

const APP_VERSION = Constants.expoConfig?.version

/** Settings: who is signed in, sign-out, account deletion (App Store guideline 5.1.1(v)), and the app's version. */
export function AccountScreen() {
	const { data: session } = authClient.useSession()

	// The stack keeps this screen mounted while it animates out after the session ends.
	if (!session) return null

	const { user } = session

	return (
		<SafeAreaView edges={['top']} style={styles.screen}>
			<Text accessibilityRole="header" style={styles.title}>
				Settings
			</Text>

			<View style={styles.account}>
				<Text style={styles.name}>{user.name}</Text>

				<Text style={styles.email}>{user.email}</Text>
			</View>

			<AccountActions account={user} />

			{APP_VERSION && <Text style={styles.version}>Version {APP_VERSION}</Text>}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		gap: 12,
		padding: 16,
		backgroundColor: COLORS.background,
	},
	title: { ...TEXT.xl, fontWeight: '700', color: COLORS.foreground },
	account: { gap: 2, marginBottom: 8 },
	name: { ...TEXT.base, fontWeight: '600', color: COLORS.foreground },
	email: { ...TEXT.sm, color: COLORS.mutedForeground },
	version: { ...TEXT.caption, marginTop: 8, color: COLORS.faintForeground },
})
