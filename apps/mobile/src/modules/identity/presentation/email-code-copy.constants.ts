/** The email-code form's words, the web's (`apps/web`, `email-code-copy.constants.ts`); final wording from Gemini 4 Carbon. */
export const EMAIL_CODE_COPY = {
	emailLabel: 'Email address',
	emailPlaceholder: 'you@example.com',
	send: 'Continue with email',
	sendForReauth: 'Email me a code',
	sending: 'Sending…',
	sentTo: (email: string) => `We sent a 6-digit code to ${email}.`,
	codeLabel: '6-digit code',
	signIn: 'Continue',
	signingIn: 'Checking…',
	resend: 'Resend code',
	resent: (email: string) => `We sent the code to ${email} again.`,
	otherEmail: 'Use a different email',
	divider: 'or',
	invalidCode: "That code isn't right or has expired.",
	tooManyCodes: 'Too many codes sent to this email. Try again in an hour.',
	tooManyAttempts: 'Too many attempts. Wait a minute and try again.',
	sendFailed: "Couldn't send the code. Try again.",
	googleLinkRefused:
		'This email already has a Soonlane account. Continue with email instead.',
}
