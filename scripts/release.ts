import { $ } from 'bun'

// Release helper for .github/workflows/release.yml. Prints key=value lines for GITHUB_OUTPUT.
//   bun scripts/release.ts stable [--version X.Y.Z]   next stable version for HEAD
//   bun scripts/release.ts write-version X.Y.Z         writes version.json (release workflow only)

// Bun's shell globs unquoted words, so tag patterns are passed as interpolated values.
const STABLE_TAG_PATTERN = /^v(\d+)\.(\d+)\.(\d+)$/u
const VERSION_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/u
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
function getBump(messages: readonly string[], current: Version) {
	let bump: Bump | undefined

	for (const message of messages) {
		const header = message.split('\n', 1)[0] ?? ''

		if (
			BREAKING_HEADER_PATTERN.test(header) ||
			/^BREAKING[ -]CHANGE:/mu.test(message)
		)
			return current.major === 0 ? 'minor' : 'major'
		if (/^feat(\(|:)/u.test(header)) bump = 'minor'
		else if (/^(fix|perf)(\(|:)/u.test(header) && !bump) bump = 'patch'
	}

	return bump
}

async function readCommitMessages(range: string) {
	const log = await $`git log --format=%B%x1e ${range}`.text()

	return log
		.split('\u001E')
		.map(message => message.trim())
		.filter(Boolean)
}

async function findLatestStableTag(ref: string) {
	const output = await $`git tag --list ${'v*'} --merged ${ref}`.text()
	const tags = output.split('\n').flatMap(tag => {
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

interface NextVersionOptions {
	ref: string
	override?: string
}

/** The next stable version for a commit: the version file before the first release, then a conventional-commit bump. */
export async function computeNextVersion({
	ref,
	override,
}: NextVersionOptions) {
	const latest = await findLatestStableTag(ref)
	const previousTag = latest?.tag ?? ''

	if (override) {
		const version = parseVersion(override)

		if (!version) throw new Error(`Invalid version override: ${override}`)
		if (latest && compareVersions(version, latest.version) <= 0)
			throw new Error(`${override} is not newer than ${latest.tag}`)

		return { version, previousTag }
	}

	if (!latest) return { version: await readVersionFile(), previousTag }

	const messages = await readCommitMessages(`${latest.tag}..${ref}`)
	const bump = getBump(messages, latest.version)

	if (!bump)
		throw new Error(
			`No feat, fix, perf or breaking commits since ${latest.tag}`
		)

	return { version: bumpVersion(latest.version, bump), previousTag }
}

function readFlag(args: readonly string[], name: string) {
	const index = args.indexOf(name)

	return index === -1 ? undefined : args[index + 1] || undefined
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

	if (command === 'stable') {
		const head = await $`git rev-parse HEAD`.text()
		const source = head.trim()
		const { version, previousTag } = await computeNextVersion({
			ref: source,
			override: readFlag(args, '--version'),
		})

		console.log(`version=${formatVersion(version)}`)
		console.log(`tag=v${formatVersion(version)}`)
		console.log(`previous_tag=${previousTag}`)
		console.log(`source=${source}`)
		return
	}

	throw new Error(
		'Usage: release.ts stable [--version X.Y.Z] | write-version X.Y.Z'
	)
}

await main(process.argv.slice(2))
