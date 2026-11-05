import { RuleTester } from 'oxlint/plugins-dev'
import { describe, test } from 'vitest'
import { fileRoleFolderRule } from './file-role-folder.rule.mts'

RuleTester.describe = describe
RuleTester.it = test

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'ts' } },
})

const code = 'export const value = 1'
const MODULE = 'apps/web/src/modules/price-tracking'

ruleTester.run('file-role-folder', fileRoleFolderRule, {
	valid: [
		`${MODULE}/infrastructure/price.repository.ts`,
		`${MODULE}/infrastructure/price-source.layer.ts`,
		`${MODULE}/infrastructure/bandcamp-price.parser.ts`,
		`${MODULE}/infrastructure/discogs.client.ts`,
		`${MODULE}/application/price-tracking.service.ts`,
		`${MODULE}/application/price-source.port.ts`,
		'apps/web/src/modules/identity/presentation/auth.client.ts',
		'apps/web/src/lib/orpc/rpc.client.ts',
		'apps/web/src/lib/orpc/rpc.client.server.ts',
		'apps/web/src/platform/db/db.layer.ts',
		'apps/web/src/utils/cn.util.ts',
		`${MODULE}/domain/price-snapshot.helper.ts`,
		`${MODULE}/presentation/cron.handler.ts`,
		`${MODULE}/presentation/helpers/price-line.helper.ts`,
		'packages/contracts/src/auth.errors.ts',
		`${MODULE}/infrastructure/price-snapshot-rows.helper.spec.ts`,
	].map(filename => ({ code, filename })),
	invalid: [
		[
			`${MODULE}/application/price.repository.ts`,
			'repository',
			'infrastructure/',
		],
		[
			`${MODULE}/presentation/price-source.layer.ts`,
			'layer',
			'infrastructure/ or platform/',
		],
		[`${MODULE}/domain/bandcamp-price.parser.ts`, 'parser', 'infrastructure/'],
		[
			`${MODULE}/domain/discogs.client.ts`,
			'client',
			'infrastructure/ or presentation/ or lib/',
		],
		[
			`${MODULE}/infrastructure/price-tracking.service.ts`,
			'service',
			'application/',
		],
		[`${MODULE}/domain/price-source.port.ts`, 'port', 'application/'],
		[`${MODULE}/presentation/helpers/format.util.ts`, 'util', 'src/utils/'],
	].map(([filename, role, folders]) => ({
		code,
		filename,
		errors: [{ messageId: 'wrongFolder', data: { role, folders } }],
	})),
})
