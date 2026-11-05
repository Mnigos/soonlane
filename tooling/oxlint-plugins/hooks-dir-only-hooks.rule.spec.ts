import { RuleTester } from 'oxlint/plugins-dev'
import { describe, test } from 'vitest'
import { hooksDirOnlyHooksRule } from './hooks-dir-only-hooks.rule.mts'

RuleTester.describe = describe
RuleTester.it = test

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'tsx' } },
})

const code = 'export const value = 1'
const HOOKS = 'apps/web/src/modules/wanted-albums/presentation/hooks'

ruleTester.run('hooks-dir-only-hooks', hooksDirOnlyHooksRule, {
	valid: [
		`${HOOKS}/use-shelf-albums.ts`,
		`${HOOKS}/use-album-item.tsx`,
		`${HOOKS}/use-delete-album.spec.tsx`,
		`${HOOKS}/cache/use-album-cache.ts`,
		'apps/web/src/modules/wanted-albums/presentation/helpers/album-list-cache.helper.ts',
		'apps/web/src/modules/wanted-albums/presentation/hooks-guide/notes.helper.ts',
	].map(filename => ({ code, filename })),
	invalid: [
		`${HOOKS}/album-list-cache.ts`,
		`${HOOKS}/album-list-cache.helper.ts`,
		`${HOOKS}/cache/album-list-cache.helper.ts`,
		`${HOOKS}/album-mutations.spec.tsx`,
		`${HOOKS}/useShelfAlbums.ts`,
		`${HOOKS}/use-shelf-albums.helper.ts`,
	].map(filename => ({
		code,
		filename,
		errors: [{ messageId: 'notAHook' }],
	})),
})
