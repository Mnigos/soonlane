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

export interface Release {
	version: string
	date: CalendarDate
	url: string
	groups: ReleaseGroup[]
}
