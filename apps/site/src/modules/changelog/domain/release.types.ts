import type { CalendarDate } from '@soonlane/domain'

export interface ReleaseEntry {
	text: string
	commitUrl: string
	pullRequestUrl?: string
}

export interface ReleaseGroup {
	kind: 'feature' | 'fix' | 'performance'
	scope: string
	entries: ReleaseEntry[]
}

/** A run of summary text; with `href` it is a link. */
export interface ReleaseTextSegment {
	text: string
	href?: string
}

/** One line of summary text, split around its inline links. */
export type ReleaseText = ReleaseTextSegment[]

/** A feature area of the summary, such as "Tasks", with its bullet entries. */
export interface ReleaseSummaryArea {
	title: string
	entries: ReleaseText[]
}

/** The words written for users at the top of a release, above the git-cliff list. */
export interface ReleaseSummary {
	paragraphs: ReleaseText[]
	areas: ReleaseSummaryArea[]
}

export interface Release {
	version: string
	date: CalendarDate
	url: string
	summary?: ReleaseSummary
	groups: ReleaseGroup[]
}
