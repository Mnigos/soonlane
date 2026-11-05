import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { RuleTester } from 'oxlint/plugins-dev'
import { describe, test } from 'vitest'
import { specFilePairingRule } from './spec-file-pairing.rule.mts'

RuleTester.describe = describe
RuleTester.it = test

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'tsx' } },
})

const code = "test('works', () => {})"
const root = mkdtempSync(join(tmpdir(), 'soonlist-spec-pairing-'))
const helpers = join(root, 'apps/web/src/modules/shelf/presentation/helpers')
const components = join(
	root,
	'apps/web/src/modules/shelf/presentation/components'
)

mkdirSync(helpers, { recursive: true })
mkdirSync(components, { recursive: true })
writeFileSync(join(helpers, 'shelf.helper.ts'), '')
writeFileSync(join(components, 'album-card.tsx'), '')
writeFileSync(join(components, 'album-grid.skeleton.tsx'), '')

ruleTester.run('spec-file-pairing', specFilePairingRule, {
	valid: [
		join(helpers, 'shelf.helper.spec.ts'),
		join(components, 'album-card.spec.tsx'),
		join(components, 'album-card.spec.ts'),
		join(components, 'album-grid.skeleton.spec.tsx'),
		join(helpers, 'shelf.helper.ts'),
		join(root, 'apps/web/tests/integration/capture.integration.spec.ts'),
		join(root, 'tooling/oxlint-plugins/file-role-suffix.rule.spec.ts'),
	].map(filename => ({ code, filename })),
	invalid: [
		[join(helpers, 'shelf.spec.ts'), 'shelf'],
		[join(helpers, 'purchase.helper.spec.ts'), 'purchase.helper'],
		[join(components, 'album-mutations.spec.tsx'), 'album-mutations'],
		[
			join(root, 'apps/web/src/platform/rpc/capture.integration.spec.ts'),
			'capture.integration',
		],
	].map(([filename, source]) => ({
		code,
		filename,
		errors: [{ messageId: 'missingSource', data: { source } }],
	})),
})
