import { useMutation } from '@tanstack/react-query'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OutlineButton } from '@/modules/shell/presentation/components/outline-button'
import { signInWithGoogle } from '@/platform/auth/auth.client'
import { COLORS, TEXT } from '@/tokens.gen'

const SIGN_IN_FAILED = 'Sign-in failed. Try again.'

/** The only screen a signed-out user sees; the root layout opens the app once the sheet hands back a session. */
export function SignInScreen() {
	const { mutate, isPending, error } = useMutation({
		mutationFn: async () => {
			const { error: signInError } = await signInWithGoogle()

			if (signInError) throw new Error(SIGN_IN_FAILED, { cause: signInError })
		},
	})

	return (
		<SafeAreaView style={styles.screen}>
			<Text accessibilityRole="header" style={styles.heading}>
				Log in or sign up
			</Text>

			<Text style={styles.description}>
				Continue with your Google account. New to Soonlane? This creates your
				account.
			</Text>

			<OutlineButton disabled={isPending} onPress={() => mutate()}>
				{isPending ? 'Signing in…' : 'Continue with Google'}
			</OutlineButton>

			{error && (
				<Text accessibilityRole="alert" style={styles.error}>
					{SIGN_IN_FAILED}
				</Text>
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 24,
		backgroundColor: COLORS.background,
	},
	heading: {
		...TEXT['2xl'],
		fontWeight: '700',
		letterSpacing: -0.6,
		color: COLORS.foreground,
	},
	description: {
		...TEXT.sm,
		marginBottom: 20,
		color: COLORS.mutedForeground,
	},
	error: { ...TEXT.sm, fontWeight: '500', color: COLORS.danger },
})
