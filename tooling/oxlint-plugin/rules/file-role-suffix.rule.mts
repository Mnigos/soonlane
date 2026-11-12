import { defineRule } from '@oxlint/plugins'
import {
	type FilePath,
	getRoleSuffix,
	hasSegment,
	ROLE_SUFFIXES,
	toFilePath,
} from '../helpers/file-role.helper.mts'

const COMPONENT_FILE_PATTERN =
	/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.(?:route|skeleton))?\.tsx$/u
const HOOK_FILE_PATTERN = /^use-[a-z0-9-]+\.tsx?$/u
const GENERATED_PATTERN = /\.(?:gen|d)\.ts$/u
const IGNORED_SEGMENTS = ['routes', 'scripts'] as const
/** Entry points whose names TanStack Start, the virtual route config, the Electrobun config and the API's build command fix. */
const FRAMEWORK_ENTRIES = [
	'/src/router.tsx',
	'/src/routes.ts',
	'/src/start.ts',
	'apps/api/src/main.ts',
	'apps/desktop/src/main.ts',
] as const

function isIgnored(file: FilePath) {
	return (
		file.basename === 'index.ts' ||
		GENERATED_PATTERN.test(file.basename) ||
		IGNORED_SEGMENTS.some(segment => hasSegment(file, segment)) ||
		FRAMEWORK_ENTRIES.some(entry => file.path.endsWith(entry)) ||
		(hasSegment(file, 'hooks') && HOOK_FILE_PATTERN.test(file.basename))
	)
}

function isValidName(file: FilePath) {
	if (hasSegment(file, 'components') && file.basename.endsWith('.tsx'))
		return COMPONENT_FILE_PATTERN.test(file.basename)

	return getRoleSuffix(file) !== undefined
}

/**
 * Requires every source file to be named `<kebab-name>.<role>.ts` with a role
 * from the closed AGENTS.md naming table, or `<kebab-name>.<role>.<role>.ts`
 * for a file that belongs to another (`task.repository.types.ts`). Components, hooks, routes,
 * package barrels, generated files and scripts keep their own names.
 */
export const fileRoleSuffixRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Source files carry a role suffix from the closed AGENTS.md naming table.',
		},
		messages: {
			missingRoleSuffix: `Name the file <kebab-name>.<role>.ts (or <kebab-name>.<role>.<role>.ts) with roles from ${ROLE_SUFFIXES.join(', ')} (AGENTS.md naming table). Components stay bare kebab-case or end in .skeleton.tsx; hooks are use-*.ts.`,
		},
	},
	create(context) {
		const file = toFilePath(context.filename)

		return {
			Program(node) {
				if (isIgnored(file) || isValidName(file)) return

				context.report({ node, messageId: 'missingRoleSuffix' })
			},
		}
	},
})
