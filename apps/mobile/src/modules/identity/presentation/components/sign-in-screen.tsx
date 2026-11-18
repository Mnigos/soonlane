import { orpcQuery } from '@soonlane/app/rpc-query'
import type { SignInMethods } from '@soonlane/contracts'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, useSyncExternalStore } from 'react'
import {
	ActivityIndicator,
	KeyboardAvoidingView,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OutlineButton } from '@/modules/shell/presentation/components/outline-button'
import {
	cancelHandOff,
	HAND_OFF_TIMED_OUT,
	isHandOffCancellable,
	subscribeToHandOff,
} from '@/platform/auth/android-hand-off.client'
import { signInWithGoogle } from '@/platform/auth/auth.client'
import { COLORS, TEXT } from '@/tokens.gen'
import { EMAIL_CODE_COPY } from '../email-code-copy.constants'
import { EmailCodeForm } from './email-code-form'

export const SIGN_IN_FAILED = 'Sign-in failed. Try again.'
const SIGN_IN_TIMED_OUT = 'Sign-in took too long. Try again.'

/** What a failed sign-in says; Android's hand-off that waited too long says so, since starting again works. */
export function signInFailureMessage(error: Error) {
	return error.message === HAND_OFF_TIMED_OUT
		? SIGN_IN_TIMED_OUT
		: SIGN_IN_FAILED
}

const DESCRIPTIONS = {
	both: 'Continue with Google or your email. New to Soonlane? This creates your account.',
	google:
		'Continue with your Google account. New to Soonlane? This creates your account.',
	email:
		'Continue with your email. New to Soonlane? This creates your account.',
}
const METHODS_FAILED = "Couldn't reach Soonlane. Check your connection."

function toDescription({ google, emailCode }: SignInMethods) {
	if (google && emailCode) return DESCRIPTIONS.both

	return google ? DESCRIPTIONS.google : DESCRIPTIONS.email
}

interface MethodsPendingProps {
	isLoading: boolean
	onRetry: () => void
}

/** Until the server says which ways in it offers: a spinner while it answers, then a retry, never a screen without a way in. */
function MethodsPending({ isLoading, onRetry }: Readonly<MethodsPendingProps>) {
	if (isLoading) return <ActivityIndicator color={COLORS.mutedForeground} />

	return (
		<>
			<Text
				accessibilityLiveRegion="polite"
				accessibilityRole="alert"
				style={styles.error}
			>
				{METHODS_FAILED}
			</Text>

			<OutlineButton onPress={onRetry}>Try again</OutlineButton>
		</>
	)
}

/** The only screen a signed-out user sees; the root layout opens the app once a sign-in hands back a session. The server says which ways in it offers; until it answers, the screen waits, and a failure offers a retry, never a screen without a way in. */
export function SignInScreen() {
	const methods = useQuery(orpcQuery.identity.signInMethods.queryOptions())
	// A server with neither method is misconfigured; it gets the same retry as one that cannot be reached.
	const offered =
		methods.data?.google || methods.data?.emailCode ? methods.data : undefined
	const isLoading = !methods.data && methods.isFetching

	const isCancellable = useSyncExternalStore(
		subscribeToHandOff,
		isHandOffCancellable
	)
	// Google's Android exchange cannot be cancelled once its code is claimed, so the two sign-ins never run at once.
	const [isEmailSigningIn, setIsEmailSigningIn] = useState(false)
	const { mutate, isPending, error } = useMutation({
		mutationFn: async () => {
			const { error: signInError } = await signInWithGoogle()

			if (signInError) throw new Error(SIGN_IN_FAILED, { cause: signInError })
		},
	})

	return (
		<SafeAreaView style={styles.screen}>
			{/* The number pad covers the lower half of a small iPhone; the view shrinks above it and moves the focused field and its buttons above it. */}
			<KeyboardAvoidingView behavior="padding" style={styles.keyboard}>
				<ScrollView
					contentContainerStyle={styles.content}
					keyboardDismissMode="interactive"
					keyboardShouldPersistTaps="handled"
				>
					<Text accessibilityRole="header" style={styles.heading}>
						Log in or sign up
					</Text>

					{offered && (
						<Text style={styles.description}>{toDescription(offered)}</Text>
					)}

					{!offered && (
						<MethodsPending
							isLoading={isLoading}
							onRetry={() => void methods.refetch()}
						/>
					)}

					{offered?.google && (
						<OutlineButton
							disabled={isPending || isEmailSigningIn}
							onPress={() => mutate()}
						>
							{isPending ? 'Signing in…' : 'Continue with Google'}
						</OutlineButton>
					)}

					{offered?.google && offered.emailCode && (
						<View
							accessibilityElementsHidden
							importantForAccessibility="no-hide-descendants"
							style={styles.divider}
						>
							<View style={styles.rule} />

							<Text style={styles.dividerLabel}>{EMAIL_CODE_COPY.divider}</Text>

							<View style={styles.rule} />
						</View>
					)}

					{offered?.emailCode && (
						<EmailCodeForm
							disabled={isPending}
							onSigningInChange={setIsEmailSigningIn}
						/>
					)}

					{isPending && isCancellable && (
						<>
							<Text style={styles.description}>
								Finish signing in in your browser. Soonlane opens here when you
								are done.
							</Text>

							<OutlineButton onPress={cancelHandOff}>Cancel</OutlineButton>
						</>
					)}

					{error && (
						<Text
							accessibilityLiveRegion="polite"
							accessibilityRole="alert"
							style={styles.error}
						>
							{signInFailureMessage(error)}
						</Text>
					)}
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: COLORS.background },
	keyboard: { flex: 1 },
	content: {
		flexGrow: 1,
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 24,
		paddingVertical: 24,
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
	divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	rule: {
		flex: 1,
		height: StyleSheet.hairlineWidth,
		backgroundColor: COLORS.border,
	},
	dividerLabel: { ...TEXT.caption, color: COLORS.faintForeground },
})
