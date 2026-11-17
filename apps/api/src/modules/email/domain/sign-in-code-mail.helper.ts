/** A mail ready to send: plain text only, no links, so it works in every client and gives a phishing copy nothing to imitate. */
export interface MailContent {
	subject: string
	text: string
}

/** The sign-in code mail; the code leads the subject, so iOS and Android offer it for autofill. */
export function toSignInCodeMail(code: string): MailContent {
	return {
		subject: `${code} is your Soonlane code`,
		text: [
			`Your Soonlane sign-in code is ${code}.`,
			'',
			'It expires in 10 minutes. Soonlane will never ask you for this code.',
			'',
			"If you didn't request it, you can ignore this email.",
		].join('\n'),
	}
}
