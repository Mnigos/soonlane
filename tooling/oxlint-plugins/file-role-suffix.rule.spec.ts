import { RuleTester } from 'oxlint/plugins-dev'
import { describe, test } from 'vitest'
import { fileRoleSuffixRule } from './file-role-suffix.rule.mts'

RuleTester.describe = describe
RuleTester.it = test

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'ts' } },
})

const code = 'export const value = 1'
const WEB = 'apps/web/src'
const MODULE = `${WEB}/modules/wanted-albums`

ruleTester.run('file-role-suffix', fileRoleSuffixRule, {
	valid: [
		`${MODULE}/application/albums.service.ts`,
		`${MODULE}/application/album-repository.port.ts`,
		`${MODULE}/infrastructure/album.repository.ts`,
		`${MODULE}/infrastructure/album-sorting.helper.ts`,
		`${MODULE}/presentation/capture.handler.ts`,
		`${MODULE}/presentation/albums.router.ts`,
		`${MODULE}/presentation/album.mock.ts`,
		`${MODULE}/domain/album.errors.ts`,
		`${WEB}/modules/identity/presentation/auth.client.ts`,
		`${WEB}/modules/album-extraction/infrastructure/html-metadata.parser.ts`,
		`${WEB}/platform/app.runtime.ts`,
		`${WEB}/platform/app.layers.ts`,
		`${WEB}/platform/config/app.config.ts`,
		`${WEB}/platform/rpc/rpc.base.ts`,
		`${WEB}/platform/rpc/rpc.context.ts`,
		`${WEB}/lib/orpc/rpc.client.ts`,
		`${WEB}/lib/orpc/rpc.client.server.ts`,
		`${WEB}/lib/orpc/rpc-prefix.constants.ts`,
		`${WEB}/utils/cn.util.ts`,
		'packages/domain/src/albums/album-id.types.ts',
		'packages/contracts/src/albums.contract.ts',
		'packages/contracts/src/price.schemas.ts',
		'packages/db/schema/wanted-albums.schema.ts',
		'packages/db/schema/index.ts',
		'packages/domain/index.ts',
		`${WEB}/routeTree.gen.ts`,
		`${WEB}/router.tsx`,
		`${WEB}/routes.ts`,
		`${WEB}/routes/__root.tsx`,
		`${MODULE}/presentation/routes/api.capture.route.ts`,
		`${MODULE}/presentation/routes/index.route.tsx`,
		`${MODULE}/presentation/components/album/album-card.tsx`,
		`${MODULE}/presentation/components/album/album-grid.skeleton.tsx`,
		`${WEB}/components/ui/button.tsx`,
		`${MODULE}/presentation/hooks/use-shelf-albums.ts`,
		`${MODULE}/presentation/helpers/shelf.helper.spec.ts`,
		`${MODULE}/presentation/components/album/album-card.spec.tsx`,
		'apps/web/scripts/dev-session.ts',
		'apps/web/tests/support/database-teardown.ts',
		'apps/web/src/vite-env.d.ts',
	].map(filename => ({ code, filename })),
	invalid: [
		`${WEB}/lib/orpc/client.ts`,
		`${MODULE}/infrastructure/drizzle-album-repository.ts`,
		`${MODULE}/presentation/helpers/shelf.ts`,
		`${MODULE}/presentation/album.fixture.ts`,
		`${WEB}/utils/cn.ts`,
		'packages/contracts/src/contract.ts',
		'packages/domain/src/albums/album-limits.ts',
		`${MODULE}/presentation/helpers/purchase.helpers.ts`,
		`${MODULE}/presentation/helpers/Shelf.helper.ts`,
		`${MODULE}/presentation/components/album/album-card.view.tsx`,
		`${MODULE}/presentation/hooks/album-list-cache.ts`,
		`${WEB}/platform/rpc/context.fixture.ts`,
	].map(filename => ({
		code,
		filename,
		errors: [{ messageId: 'missingRoleSuffix' }],
	})),
})
