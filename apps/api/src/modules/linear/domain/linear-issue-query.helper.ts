/** An issue's link, with or without the scheme: `linear.app/<workspace>/issue/<identifier>/<slug>`. */
const ISSUE_LINK =
	/^(?:https?:\/\/)?linear\.app\/[\w-]+\/issue\/([a-z][a-z0-9]*-\d+)(?:[/?#]|$)/iu
const IDENTIFIER = /^[a-z][a-z0-9]*-\d+$/iu
const OTHER_LINK = /^(?:https?:\/\/|www\.)\S*$/iu

export type LinearIssueQuery =
	| { match: 'assigned' }
	| { match: 'search'; term: string }
	| { match: 'link'; identifier: string }
	| { match: 'otherLink' }

/** What the picker's field asks for: nothing typed lists the assigned issues, an identifier or an issue's link names one issue. */
export function parseLinearIssueQuery(query: string): LinearIssueQuery {
	const identifier = ISSUE_LINK.exec(query)?.[1] ?? IDENTIFIER.exec(query)?.[0]

	if (query === '') return { match: 'assigned' }
	if (identifier) return { match: 'link', identifier: identifier.toUpperCase() }
	if (OTHER_LINK.test(query)) return { match: 'otherLink' }

	return { match: 'search', term: query }
}
