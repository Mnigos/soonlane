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
const ROLE_FILE_PATTERN = new RegExp(
	String.raw`^[a-z0-9]+(?:-[a-z0-9]+)*\.(${[...ROLE_SUFFIXES, ...FRAMEWORK_SUFFIXES].join('|')})(?:\.server)?\.tsx?$`,
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

export function getRoleSuffix({ basename }: FilePath): string | undefined {
	return ROLE_FILE_PATTERN.exec(basename)?.[1]
}
