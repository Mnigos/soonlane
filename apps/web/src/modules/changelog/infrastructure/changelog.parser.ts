import { storedCalendarDateSchema } from '@soonlane/contracts'
import type {
	Release,
	ReleaseGroup,
	ReleaseSummary,
	ReleaseText,
} from '../domain/release.types'

const RELEASE_PATTERN =
	/^## \[(\d+\.\d+\.\d+)\]\((https:\/\/[^\s)]+)\) - (\d{4}-\d{2}-\d{2})$/u
const GROUP_PATTERN = /^### (.+) › (.+)$/u
const ENTRY_PATTERN =
	/^- (.+?)(?: \(\[#\d+\]\((https:\/\/[^\s)]+)\)\))? \(\[[0-9a-f]{7}\]\((https:\/\/[^\s)]+)\)\)$/u
const AREA_PATTERN = /^### ([^›\s][^›]*)$/u
const SUMMARY_ENTRY_PATTERN = /^- (\S.*)$/u
/** A paragraph line may not open like any other markdown block, so a stray heading or list fails the build. */
const PARAGRAPH_PATTERN = /^(?![#>*|`<+=-]|\d+[.)]\s)\S.*$/u
const LINK_PATTERN = /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/u
const GROUP_KINDS = new Map<string, ReleaseGroup['kind']>([
	['Features', 'feature'],
	['Bug fixes', 'fix'],
	['Performance', 'performance'],
])

/** Splits `[text](https://…)` links out of a summary line; any other markdown stays literal. */
function parseInlineLinks(line: string): ReleaseText {
	const parts = line.split(new RegExp(LINK_PATTERN, 'gu'))

	return parts.flatMap((part, index) => {
		if (index % 3 === 1) return [{ text: part, href: parts[index + 1] }]
		if (index % 3 === 2 || part === '') return []

		return [{ text: part }]
	})
}

/** Paragraph lines, then `### <feature area>` headings with `- ` entries; nothing comes back after the first area. */
function parseSummaryLine(release: Release, line: string) {
	const summary: ReleaseSummary = release.summary ?? {
		paragraphs: [],
		areas: [],
	}
	const area = summary.areas.at(-1)
	const [, title] = AREA_PATTERN.exec(line) ?? []
	const [, entry] = SUMMARY_ENTRY_PATTERN.exec(line) ?? []

	if (title) summary.areas.push({ title, entries: [] })
	else if (entry && area) area.entries.push(parseInlineLinks(entry))
	else if (!area && PARAGRAPH_PATTERN.test(line))
		summary.paragraphs.push(parseInlineLinks(line))
	else return false

	release.summary = summary
	return true
}

/** git-cliff's `### <Type> › <scope>` groups and their entries, as `cliff.toml` writes them. */
function parseChangeLine(release: Release, line: string) {
	const [, heading = '', scope = ''] = GROUP_PATTERN.exec(line) ?? []
	const kind = GROUP_KINDS.get(heading)
	const group = release.groups.at(-1)
	const [, text = '', pullRequestUrl, commitUrl] =
		ENTRY_PATTERN.exec(line) ?? []

	if (kind) release.groups.push({ kind, scope, entries: [] })
	else if (commitUrl && group)
		group.entries.push({ text, commitUrl, pullRequestUrl })
	else return false

	return true
}

function parseLine(releases: Release[], line: string) {
	const [, version, url = '', date = ''] = RELEASE_PATTERN.exec(line) ?? []
	const release = releases.at(-1)

	if (version) {
		releases.push({
			version,
			date: storedCalendarDateSchema.parse(date),
			url,
			groups: [],
		})
		return true
	}
	if (!release) return false
	if (release.groups.length > 0 || GROUP_PATTERN.test(line))
		return parseChangeLine(release, line)

	return parseSummaryLine(release, line)
}

/**
 * Reads `CHANGELOG.md` (format in `docs/release.md`): each `## [X.Y.Z](url) - YYYY-MM-DD` section holds an
 * optional summary written for users, then git-cliff's list. A heading with `›` starts the list; summary lines
 * after it, or any line outside the format, throw so a bad edit fails the build.
 */
export function parseChangelog(changelog: string) {
	const releases: Release[] = []
	const lines = changelog.split('\n')
	const firstRelease = lines.findIndex(line => line.startsWith('## '))

	if (firstRelease === -1) return releases

	for (const [index, line] of lines.entries()) {
		if (index < firstRelease || line.trim() === '') continue
		if (!parseLine(releases, line))
			throw new Error(
				`CHANGELOG.md line ${index + 1} does not match the changelog format in docs/release.md (a summary goes above the first "### Type › scope" group): ${line}`
			)
	}

	return releases
}
