import { join, resolve } from 'node:path'
import { $ } from 'bun'

// Release helper for .github/workflows/release.yml and the release skill. Prints key=value lines for GITHUB_OUTPUT.
//   bun scripts/release.ts nightly                                                nightly tag for HEAD, if it has changes since the last nightly
//   bun scripts/release.ts stable [--version X.Y.Z]                               the next stable version and the latest nightly it promotes
//   bun scripts/release.ts prepare --summary <file> [--version X.Y.Z] [--out <dir>]  writes CHANGELOG.md and version.json for that release
//   bun scripts/release.ts publish --notes <file>                                 the release version.json pins, unless it is published

const STABLE_TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/u
const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/u
const NIGHTLY_TAG_PATTERN = /^v(\d+\.\d+\.\d+)-nightly\.(\d{8})\.(\d+)$/u
const BREAKING_HEADER_PATTERN = /^[a-z]+(\([^)]*\))?!:/u
const ROOT = resolve(import.meta.dir, '..')
const VERSION_FILE = join(ROOT, 'version.json')
const CHANGELOG_FILE = join(ROOT, 'CHANGELOG.md')

type Bump = 'major' | 'minor' | 'patch'

interface Version {
	major: number
	minor: number
	patch: number
}

function parseVersion(
	text: string,
	pattern = VERSION_PATTERN
): Version | undefined {
	const match = pattern.exec(text.trim())

	if (!match) return undefined

	const [, major = '', minor = '', patch = ''] = match

	return { major: Number(major), minor: Number(minor), patch: Number(patch) }
}

const formatVersion = ({ major, minor, patch }: Version) =>
	`${major}.${minor}.${patch}`

function compareVersions(left: Version, right: Version) {
	return (
		left.major - right.major ||
		left.minor - right.minor ||
		left.patch - right.patch
	)
}

function bumpVersion(version: Version, bump: Bump): Version {
	if (bump === 'major') return { major: version.major + 1, minor: 0, patch: 0 }
	if (bump === 'minor')
		return { major: version.major, minor: version.minor + 1, patch: 0 }

	return { ...version, patch: version.patch + 1 }
}

/** Conventional-commit bump: before 1.0 a breaking change or feat bumps the minor, fix and perf the patch. */
function getBump(
	messages: readonly string[],
	current: Version
): Bump | undefined {
	const headers = messages.map(message => message.split('\n', 1)[0] ?? '')

	if (
		headers.some(header => BREAKING_HEADER_PATTERN.test(header)) ||
		messages.some(message => /^BREAKING[ -]CHANGE:/mu.test(message))
	)
		return current.major === 0 ? 'minor' : 'major'
	if (headers.some(header => /^feat(\(|:)/u.test(header))) return 'minor'
	if (headers.some(header => /^(fix|perf)(\(|:)/u.test(header))) return 'patch'

	return undefined
}

async function readCommitMessages(range: string) {
	const log = await $`git log --format=%B%x1e ${range}`.text()

	return log
		.split('\u001E')
		.map(message => message.trim())
		.filter(Boolean)
}

/** Bun's shell globs unquoted words, so tag patterns are passed as interpolated values. */
async function listTags(pattern: string, ref?: string) {
	const merged = ref ? ['--merged', ref] : []
	const output = await $`git tag --list ${pattern} ${merged}`.text()

	return output.split('\n').filter(Boolean)
}

async function findLatestStableTag(ref?: string) {
	const names = await listTags('v*', ref)
	const tags = names.flatMap(tag => {
		const version = parseVersion(tag, STABLE_TAG_PATTERN)

		return version ? [{ tag, version }] : []
	})

	return tags.toSorted((left, right) =>
		compareVersions(right.version, left.version)
	)[0]
}

async function readVersionFile() {
	const content: unknown = await Bun.file(VERSION_FILE).json()
	const isObject = typeof content === 'object' && content !== null
	const version =
		isObject && 'version' in content && typeof content.version === 'string'
			? parseVersion(content.version)
			: undefined
	const nightly =
		isObject && 'nightly' in content && typeof content.nightly === 'string'
			? content.nightly
			: undefined

	if (!version) throw new Error('version.json must hold { "version": "X.Y.Z" }')

	return { version, nightly }
}

/** `ownTag` is the release's own tag when it already exists; it may be the latest, nothing else may be newer. */
async function assertNewerThanLatestStable(version: Version, ownTag?: string) {
	const latest = await findLatestStableTag()

	if (
		latest &&
		latest.tag !== ownTag &&
		compareVersions(version, latest.version) <= 0
	)
		throw new Error(
			`v${formatVersion(version)} is not newer than ${latest.tag}`
		)

	return latest
}

interface NightlyTag {
	tag: string
	version: Version
	date: string
	counter: number
}

/** Nightly tags, newest first by date and run counter. */
async function listNightlyTags(ref?: string) {
	const names = await listTags('v*-nightly.*', ref)
	const tags = names.flatMap((tag): NightlyTag[] => {
		const match = NIGHTLY_TAG_PATTERN.exec(tag)
		const version = match?.[1] ? parseVersion(match[1]) : undefined

		return match && version
			? [{ tag, version, date: match[2] ?? '', counter: Number(match[3]) }]
			: []
	})

	return tags.toSorted(
		(left, right) =>
			right.date.localeCompare(left.date) || right.counter - left.counter
	)
}

/** The conventional-commit successor of the last stable tag; the version file before the first release. */
async function findNextVersion(ref: string) {
	const latest = await findLatestStableTag(ref)

	if (!latest) {
		const { version } = await readVersionFile()

		return { version, latest }
	}

	const messages = await readCommitMessages(`${latest.tag}..${ref}`)
	const bump = getBump(messages, latest.version)

	return {
		version: bump ? bumpVersion(latest.version, bump) : undefined,
		latest,
	}
}

async function resolveCommit(ref: string) {
	const sha = await $`git rev-parse ${`${ref}^{commit}`}`.text()

	return sha.trim()
}

const getUtcDate = (now: Date) =>
	now.toISOString().slice(0, 10).replaceAll('-', '')

/** A nightly for HEAD when it has commits since the last nightly other than release commits. */
async function computeNightly(now: Date) {
	const source = await resolveCommit('HEAD')
	const [previous] = await listNightlyTags(source)
	const messages = await readCommitMessages(
		previous ? `${previous.tag}..${source}` : source
	)
	const hasChanges = messages.some(
		message => !message.startsWith('chore(release):')
	)
	const { version, latest } = await findNextVersion(source)
	// Only docs or chores since the last stable: the nightly still previews the next patch.
	const base =
		version ?? (latest ? bumpVersion(latest.version, 'patch') : undefined)

	if (!base) throw new Error('Could not compute a nightly version')

	const date = getUtcDate(now)
	const allNightlies = await listNightlyTags()
	const counter =
		allNightlies.filter(nightly => nightly.date === date).length + 1

	return {
		has_changes: String(hasChanges),
		version: formatVersion(base),
		tag: `v${formatVersion(base)}-nightly.${date}.${counter}`,
		previous_tag: previous?.tag ?? '',
		source,
	}
}

/** Stable promotes the latest nightly's commit; its version defaults to the one the nightly previewed. */
async function computeStable(override?: string) {
	const [nightly] = await listNightlyTags()

	if (!nightly)
		throw new Error('No nightly release yet; run the nightly channel first')

	const version = override ? parseVersion(override) : nightly.version

	if (!version) throw new Error(`Invalid version override: ${override}`)

	const latest = await assertNewerThanLatestStable(version)

	return {
		version: formatVersion(version),
		tag: `v${formatVersion(version)}`,
		previous_tag: latest?.tag ?? '',
		source: await resolveCommit(nightly.tag),
		nightly_tag: nightly.tag,
	}
}

const releaseHeading = (version: string) => `\n## [${version}](`

/** Prepends the release's section to CHANGELOG.md in `outDir`: the summary, then git-cliff's list up to the nightly. */
async function prepareRelease(
	summaryFile: string,
	outDir: string,
	override?: string
) {
	const release = await computeStable(override)
	const summary = await Bun.file(summaryFile).text()
	const current = await Bun.file(CHANGELOG_FILE).text()
	const changelog = resolve(outDir, 'CHANGELOG.md')
	const range = release.previous_tag
		? `${release.previous_tag}..${release.source}`
		: release.source

	if (current.includes(releaseHeading(release.version)))
		throw new Error(`CHANGELOG.md already has a section for ${release.version}`)
	if (changelog !== CHANGELOG_FILE) await Bun.write(changelog, current)

	await $`bun git-cliff ${range} --tag ${release.tag} --prepend ${changelog}`
		.cwd(ROOT)
		.quiet()

	const text = await Bun.file(changelog).text()
	const headingEnd =
		text.indexOf('\n', text.indexOf(releaseHeading(release.version)) + 1) + 1

	await Bun.write(
		changelog,
		`${text.slice(0, headingEnd)}\n${summary.trim()}\n${text.slice(headingEnd)}`
	)
	await Bun.write(
		resolve(outDir, 'version.json'),
		`${JSON.stringify({ version: release.version, nightly: release.nightly_tag }, null, 2)}\n`
	)

	return release
}

/** Nothing once the GitHub Release exists; a tag already on the nightly's commit is kept, so a re-run can publish it. */
async function computePublish(
	notesFile: string
): Promise<Record<string, string>> {
	const { version, nightly } = await readVersionFile()
	const tag = `v${formatVersion(version)}`
	const { exitCode } = await $`gh release view ${tag} --json tagName`
		.nothrow()
		.quiet()

	if (exitCode === 0) return { tag, released: 'true' }

	const [nightlyTag] = nightly ? await listTags(nightly) : []

	if (!nightlyTag)
		throw new Error(
			`version.json pins nightly "${nightly ?? ''}", which is not a tag`
		)

	const source = await resolveCommit(nightlyTag)
	const [existingTag] = await listTags(tag)

	if (existingTag && (await resolveCommit(existingTag)) !== source)
		throw new Error(`${tag} exists but does not point at ${nightlyTag}`)

	await assertNewerThanLatestStable(version, existingTag)

	const changelog = await Bun.file(CHANGELOG_FILE).text()
	const start = changelog.indexOf(releaseHeading(formatVersion(version)))

	if (start === -1)
		throw new Error(`CHANGELOG.md has no section for ${formatVersion(version)}`)

	const end = changelog.indexOf('\n## [', start + 1)

	await Bun.write(
		notesFile,
		`${changelog.slice(start, end === -1 ? undefined : end).trim()}\n`
	)

	return {
		tag,
		released: 'false',
		tag_exists: String(Boolean(existingTag)),
		source,
		nightly_tag: nightlyTag,
	}
}

function readFlag(args: readonly string[], name: string) {
	const index = args.indexOf(name)

	return index === -1 ? undefined : args[index + 1] || undefined
}

function printOutputs(outputs: Record<string, string>) {
	for (const [key, value] of Object.entries(outputs))
		console.log(`${key}=${value}`)
}

async function main([command, ...args]: string[]) {
	const summary = readFlag(args, '--summary')
	const notes = readFlag(args, '--notes')

	if (command === 'nightly')
		return printOutputs(await computeNightly(new Date()))
	if (command === 'stable')
		return printOutputs(await computeStable(readFlag(args, '--version')))
	if (command === 'prepare' && summary)
		return printOutputs(
			await prepareRelease(
				summary,
				readFlag(args, '--out') ?? ROOT,
				readFlag(args, '--version')
			)
		)
	if (command === 'publish' && notes)
		return printOutputs(await computePublish(notes))

	throw new Error(
		'Usage: release.ts nightly | stable [--version X.Y.Z] | prepare --summary <file> [--version X.Y.Z] [--out <dir>] | publish --notes <file>'
	)
}

await main(process.argv.slice(2))
