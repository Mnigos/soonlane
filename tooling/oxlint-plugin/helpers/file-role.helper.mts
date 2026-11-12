import { posix } from 'node:path'

/** The closed naming table from AGENTS.md; `.route` and `.skeleton` are framework and component suffixes. */
export const ROLE_SUFFIXES = [
	'base',
	'client',
	'config',
	'constants',
	'context',
	'contract',
	'errors',
	'handler',
	'helper',
	'layer',
	'layers',
	'mapper',
	'middleware',
	'parser',
	'port',
	'query',
	'repository',
	'router',
	'runtime',
	'schema',
	'schemas',
	'service',
	'types',
	'util',
] as const

export type RoleSuffix = (typeof ROLE_SUFFIXES)[number]

const FRAMEWORK_SUFFIXES = ['route', 'skeleton'] as const
const ROLE = `(${[...ROLE_SUFFIXES, ...FRAMEWORK_SUFFIXES].join('|')})`
/** One or two roles, e.g. `task.repository.ts` or `task.repository.types.ts` (the types of the task repository). */
const ROLE_FILE_PATTERN = new RegExp(
	String.raw`^[a-z0-9]+(?:-[a-z0-9]+)*\.${ROLE}(?:\.${ROLE})?(?:\.server)?\.tsx?$`,
	'u'
)

export interface FilePath {
	path: string
	basename: string
	directory: string
}

export function toFilePath(filename: string): FilePath {
	const path = filename.replaceAll('\\', '/')

	return {
		path,
		basename: posix.basename(path),
		directory: posix.dirname(path),
	}
}

export function hasSegment({ path }: FilePath, segment: string): boolean {
	return path.includes(`/${segment}/`) || path.startsWith(`${segment}/`)
}

/** Every role in the name, in order: `task.repository.types.ts` gives `['repository', 'types']`. */
export function getRoleSuffixes({ basename }: FilePath): string[] {
	const match = ROLE_FILE_PATTERN.exec(basename)

	return match ? match.slice(1).filter(role => role !== undefined) : []
}

/** The last role, which says what the file is: `types` for `task.repository.types.ts`. */
export function getRoleSuffix(file: FilePath): string | undefined {
	return getRoleSuffixes(file).at(-1)
}
