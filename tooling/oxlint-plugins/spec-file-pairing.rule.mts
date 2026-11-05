import { existsSync } from 'node:fs'
import { posix } from 'node:path'
import { defineRule } from '@oxlint/plugins'
import { hasSegment, isSpecFile, toFilePath } from './file-role.helper.mts'

const SPEC_SUFFIX_PATTERN = /\.spec\.tsx?$/u
const SOURCE_EXTENSIONS = ['.ts', '.tsx'] as const

/**
 * Requires each `*.spec.ts(x)` to sit next to the source file it covers
 * (`foo.helper.spec.ts` beside `foo.helper.ts`). Integration specs under
 * `tests/` and lint rule specs are exempt.
 */
export const specFilePairingRule = defineRule({
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Specs sit beside a source file with the same base name.',
		},
		messages: {
			missingSource:
				'No {{source}}.ts(x) next to this spec; name the spec after the file it covers or move cross-file flows to tests/ (AGENTS.md).',
		},
	},
	create(context) {
		const file = toFilePath(context.filename)

		return {
			Program(node) {
				if (
					!isSpecFile(file) ||
					file.basename.endsWith('.rule.spec.ts') ||
					hasSegment(file, 'tests')
				)
					return

				const source = file.basename.replace(SPEC_SUFFIX_PATTERN, '')
				const hasSource = SOURCE_EXTENSIONS.some(extension =>
					existsSync(posix.join(file.directory, `${source}${extension}`))
				)

				if (!hasSource)
					context.report({ node, messageId: 'missingSource', data: { source } })
			},
		}
	},
})
