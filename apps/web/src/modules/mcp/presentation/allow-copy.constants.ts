/** The Allow page's words; final wording from Gemini 4 Carbon. */
export const ALLOW_COPY = {
	title: (name: string) => `Allow ${name} to access your tasks?`,
	verifiedLine: (host: string) => `${host} · verified web address`,
	unverifiedLine: "Unverified app. Soonlane can't check who made it.",
	redirectLine: (redirectHost: string) =>
		`After you choose, you'll go back to ${redirectHost}.`,
	redirectLineThisComputer:
		"After you choose, you'll go back to an app on this computer.",
	loopbackWarning:
		"Soonlane can't tell which app is asking. Only allow this if you just started connecting.",
	accountLine: (email: string) => `Signed in as ${email}`,
	switchAccountLink: 'Switch account',
	readCheckbox: 'See your tasks, projects and labels',
	writeCheckbox: 'Add, edit and complete tasks',
	writeHelper: "It can't delete anything.",
	footer: (name: string) =>
		`${name} keeps access until you disconnect it or go 30 days without using it.`,
	allowButton: 'Allow',
	cancelButton: 'Cancel',
	nothingTickedHint: 'Choose at least one.',
	expired: (name: string) =>
		`This request expired. Go back to ${name} and try again.`,
	nothingRequested: (name: string) =>
		`${name} didn't ask for access to your tasks.`,
	answerFailed: "Couldn't send your choice. Try again.",
	loadFailed: "Couldn't load this agent. Try again.",
	retryButton: 'Try again',
	accountChanged:
		"You're signed in to a different account now. Nothing was allowed.",
	accountChangedButton: 'Reload',
	writeAloneCheckbox:
		'See your tasks, projects and labels, and add, edit and complete tasks',
	pageTitle: 'Allow access · Soonlane',
}
