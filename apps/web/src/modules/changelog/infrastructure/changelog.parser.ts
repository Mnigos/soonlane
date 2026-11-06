import { toCalendarDate } from '@soonlane/domain'
import type { Release, ReleaseGroup } from '../domain/release.types'

// Mirrors the body template in cliff.toml; any other line throws so a template change fails the build.
const RELEASE_PATTERN =
	/^## \[(\d+\.\d+\.\d+)\]\((https:\/\/[^\s)]+)\) - (\d{4}-\d{2}-\d{2})$/u
const GROUP_PATTERN = /^### (.+) › (.+)$/u
const ENTRY_PATTERN =
	/^- (.+?)(?: \(\[#\d+\]\((https:\/\/[^\s)]+)\)\))? \(\[[0-9a-f]{7}\]\((https:\/\/[^\s)]+)\)\)$/u
const GROUP_KINDS = new Map<string, ReleaseGroup['kind']>([
	['Features', 'feature'],
	['Bug fixes', 'fix'],
	['Performance', 'performance'],
])

export function parseChangelog(changelog: string) {
	const releases: Release[] = []
	const lines = changelog.split('\n')
	const firstRelease = lines.findIndex(line => line.startsWith('## '))

	if (firstRelease === -1) return releases

	for (const [index, line] of lines.entries()) {
		if (index < firstRelease || line.trim() === '') continue

		const release = releases.at(-1)
		const group = release?.groups.at(-1)
		const [, version, url = '', date = ''] = RELEASE_PATTERN.exec(line) ?? []
		const [, heading = '', scope = ''] = GROUP_PATTERN.exec(line) ?? []
		const kind = GROUP_KINDS.get(heading)
		const [, text = '', pullRequestUrl, commitUrl] =
			ENTRY_PATTERN.exec(line) ?? []

		if (version) {
			releases.push({ version, date: toCalendarDate(date), url, groups: [] })
		} else if (kind && release) {
			release.groups.push({ kind, scope, entries: [] })
		} else if (commitUrl && group) {
			group.entries.push({ text, commitUrl, pullRequestUrl })
		} else {
			throw new Error(
				`CHANGELOG.md line ${index + 1} does not match the cliff.toml format: ${line}`
			)
		}
	}

	return releases
}
