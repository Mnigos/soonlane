import { EMAIL_CODE_LENGTH } from '@soonlane/auth'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { OutlineButton } from '@/modules/shell/presentation/components/outline-button'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import { EMAIL_CODE_COPY } from '../email-code-copy.constants'
import { sendCodeTo, signInWithCode } from '../helpers/email-code.helper'

interface LinkButtonProps {
	label: string
	disabled: boolean
	onPress: () => void
}

function LinkButton({ label, disabled, onPress }: Readonly<LinkButtonProps>) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			disabled={disabled}
			hitSlop={8}
			onPress={onPress}
		>
			<Text style={[styles.link, disabled && styles.disabled]}>{label}</Text>
		</Pressable>
	)
}

interface EmailCodeFormProps {
	/** The account's own address, for signing in again before deleting it; the field is then hidden and cannot change. */
	fixedEmail?: string
	/** An address a code was already sent to, so the form opens at the code step. */
	initialSentTo?: string
	/** Runs once the phone holds the new session, and only while this form is still shown. */
	onSignedIn?: () => void
	/** Offers a way to close the form, for the deletion's fresh sign-in. */
	onCancel?: () => void
	/** Another sign-in is running, such as Google's; this form waits, so two sign-ins never race for the stored session. */
	disabled?: boolean
	/** Reports when a code sign-in starts and settles, so the screen can hold its other sign-in meanwhile. */
	onSigningInChange?: (isSigningIn: boolean) => void
}

/** The web's email-code sign-in: the address, then the code mailed to it; the first sign-in creates the account. */
export function EmailCodeForm({
	fixedEmail,
	initialSentTo,
	onSignedIn,
	onCancel,
	disabled = false,
	onSigningInChange,
}: Readonly<EmailCodeFormProps>) {
	const [email, setEmail] = useState(fixedEmail ?? '')
	const [code, setCode] = useState('')
	const [sentTo, setSentTo] = useState(initialSentTo)
	const [hasResent, setHasResent] = useState(false)
	const sending = useMutation({
		mutationFn: async (address: string) => {
			const sent = await sendCodeTo(address.trim())

			if (sent instanceof Error) throw sent

			return sent
		},
		onSuccess: address => {
			setHasResent(address === sentTo)
			setSentTo(address)
		},
	})
	const signingIn = useMutation({
		mutationFn: async (address: string) => {
			const failure = await signInWithCode(address, code)

			if (failure) throw failure
		},
		onMutate: () => onSigningInChange?.(true),
		// Not on success: the session is still on its way, and the screen changes once it lands.
		onError: () => onSigningInChange?.(false),
	})
	const error = signingIn.error ?? sending.error
	const isBusy = disabled || sending.isPending || signingIn.isPending
	const canSend = !isBusy && email.trim() !== ''
	// A success stays here until the session arrives and the screen changes; only the submit waits for that.
	const canSignIn =
		!isBusy && !signingIn.isSuccess && code.length === EMAIL_CODE_LENGTH

	function submitEmail() {
		if (canSend) sending.mutate(email)
	}

	/** `onSignedIn` goes with this call, so it is dropped when the form unmounted meanwhile, such as after leaving Settings. */
	function submitCode(address: string) {
		if (canSignIn) signingIn.mutate(address, { onSuccess: onSignedIn })
	}

	function changeEmail() {
		sending.reset()
		signingIn.reset()
		setSentTo(undefined)
		setHasResent(false)
		setCode('')
	}

	return (
		<View style={styles.form}>
			{sentTo ? (
				<>
					<Text style={styles.note}>
						{hasResent
							? EMAIL_CODE_COPY.resent(sentTo)
							: EMAIL_CODE_COPY.sentTo(sentTo)}
					</Text>

					<TextInput
						accessibilityLabel={EMAIL_CODE_COPY.codeLabel}
						autoComplete="one-time-code"
						autoFocus
						keyboardAppearance="dark"
						keyboardType="number-pad"
						onChangeText={value =>
							setCode(value.replaceAll(/\D/gu, '').slice(0, EMAIL_CODE_LENGTH))
						}
						onSubmitEditing={() => submitCode(sentTo)}
						placeholder={EMAIL_CODE_COPY.codeLabel}
						placeholderTextColor={COLORS.faintForeground}
						style={[styles.field, styles.code]}
						textContentType="oneTimeCode"
						value={code}
					/>

					<OutlineButton
						disabled={!canSignIn}
						onPress={() => submitCode(sentTo)}
					>
						{signingIn.isPending || signingIn.isSuccess
							? EMAIL_CODE_COPY.signingIn
							: EMAIL_CODE_COPY.signIn}
					</OutlineButton>

					<View style={styles.links}>
						<LinkButton
							disabled={isBusy}
							label={EMAIL_CODE_COPY.resend}
							onPress={() => {
								signingIn.reset()
								sending.mutate(sentTo)
							}}
						/>

						{!fixedEmail && (
							<LinkButton
								disabled={isBusy}
								label={EMAIL_CODE_COPY.otherEmail}
								onPress={changeEmail}
							/>
						)}

						{onCancel && (
							<LinkButton disabled={isBusy} label="Cancel" onPress={onCancel} />
						)}
					</View>
				</>
			) : (
				<>
					{!fixedEmail && (
						<TextInput
							accessibilityLabel={EMAIL_CODE_COPY.emailLabel}
							autoCapitalize="none"
							autoComplete="email"
							autoCorrect={false}
							keyboardAppearance="dark"
							keyboardType="email-address"
							onChangeText={setEmail}
							onSubmitEditing={submitEmail}
							returnKeyType="send"
							placeholder={EMAIL_CODE_COPY.emailPlaceholder}
							placeholderTextColor={COLORS.faintForeground}
							style={styles.field}
							textContentType="emailAddress"
							value={email}
						/>
					)}

					<OutlineButton disabled={!canSend} onPress={submitEmail}>
						{sending.isPending
							? EMAIL_CODE_COPY.sending
							: fixedEmail
								? EMAIL_CODE_COPY.sendForReauth
								: EMAIL_CODE_COPY.send}
					</OutlineButton>
				</>
			)}

			{error && (
				<Text
					accessibilityLiveRegion="polite"
					accessibilityRole="alert"
					style={styles.error}
				>
					{error.message}
				</Text>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	form: { gap: 12 },
	field: {
		...TEXT.sm,
		height: 44,
		paddingHorizontal: 12,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.borderStrong,
		borderRadius: RADIUS.md,
		color: COLORS.foreground,
	},
	code: { letterSpacing: 6, fontVariant: ['tabular-nums'] },
	note: { ...TEXT.sm, color: COLORS.mutedForeground },
	links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
	link: {
		...TEXT.caption,
		color: COLORS.mutedForeground,
		textDecorationLine: 'underline',
	},
	disabled: { opacity: 0.5 },
	error: { ...TEXT.sm, fontWeight: '500', color: COLORS.danger },
})
