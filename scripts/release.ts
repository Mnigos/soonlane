import { $ } from 'bun'

// Release helper for .github/workflows/release.yml. Prints key=value lines for GITHUB_OUTPUT.
//   bun scripts/release.ts nightly                     nightly tag for HEAD, if it has changes since the last nightly
//   bun scripts/release.ts stable [--version X.Y.Z]    promotes the latest nightly's commit
//   bun scripts/release.ts write-version X.Y.Z         writes version.json (release workflow only)

const STABLE_TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/u
const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/u
const NIGHTLY_TAG_PATTERN = /^v(\d+\.\d+\.\d+)-nightly\.(\d{8})\.(\d+)$/u
const BREAKING_HEADER_PATTERN = /^[a-z]+(\([^)]*\))?!:/u
const VERSION_FILE = new URL('../version.json', import.meta.url)

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
	const version =
		typeof content === 'object' &&
		content !== null &&
		'version' in content &&
		typeof content.version === 'string'
			? parseVersion(content.version)
			: undefined

	if (!version) throw new Error('version.json must hold { "version": "X.Y.Z" }')

	return version
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

	if (!latest) return { version: await readVersionFile(), latest }

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

	const latest = await findLatestStableTag()

	if (latest && compareVersions(version, latest.version) <= 0)
		throw new Error(
			`v${formatVersion(version)} is not newer than ${latest.tag}; wait for the next nightly or pass a newer version`
		)

	return {
		version: formatVersion(version),
		tag: `v${formatVersion(version)}`,
		previous_tag: latest?.tag ?? '',
		source: await resolveCommit(nightly.tag),
		nightly_tag: nightly.tag,
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
	if (command === 'write-version') {
		const version = args[0] ? parseVersion(args[0]) : undefined

		if (!version) throw new Error('Usage: release.ts write-version X.Y.Z')

		await Bun.write(
			VERSION_FILE,
			`${JSON.stringify({ version: formatVersion(version) }, null, 2)}\n`
		)
		return
	}

	if (command === 'nightly')
		return printOutputs(await computeNightly(new Date()))
	if (command === 'stable')
		return printOutputs(await computeStable(readFlag(args, '--version')))

	throw new Error(
		'Usage: release.ts nightly | stable [--version X.Y.Z] | write-version X.Y.Z'
	)
}

await main(process.argv.slice(2))
