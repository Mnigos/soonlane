import { definePlugin } from '@oxlint/plugins'
import { declarationGroupSpacingRule } from './declaration-group-spacing.rule.mts'
import { fileRoleFolderRule } from './file-role-folder.rule.mts'
import { fileRoleSuffixRule } from './file-role-suffix.rule.mts'
import { hookQueryNamingRule } from './hook-query-naming.rule.mts'
import { hooksDirOnlyHooksRule } from './hooks-dir-only-hooks.rule.mts'
import { inferredTypePlacementRule } from './inferred-type-placement.rule.mts'
import { jsxSiblingSpacingRule } from './jsx-sibling-spacing.rule.mts'
import { moduleNameRule } from './module-name.rule.mts'
import { noLetRule } from './no-let.rule.mts'
import { noRepositoryTryCatchRule } from './no-repository-try-catch.rule.mts'
import { propsWithChildrenRule } from './props-with-children.rule.mts'
import { typeParamPrefixRule } from './type-param-prefix.rule.mts'

export default definePlugin({
	meta: { name: 'soonlane' },
	rules: {
		'declaration-group-spacing': declarationGroupSpacingRule,
		'file-role-folder': fileRoleFolderRule,
		'file-role-suffix': fileRoleSuffixRule,
		'hook-query-naming': hookQueryNamingRule,
		'hooks-dir-only-hooks': hooksDirOnlyHooksRule,
		'inferred-type-placement': inferredTypePlacementRule,
		'jsx-sibling-spacing': jsxSiblingSpacingRule,
		'module-name': moduleNameRule,
		'no-let': noLetRule,
		'no-repository-try-catch': noRepositoryTryCatchRule,
		'props-with-children': propsWithChildrenRule,
		'type-param-prefix': typeParamPrefixRule,
	},
})
