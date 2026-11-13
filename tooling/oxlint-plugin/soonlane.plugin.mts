import { definePlugin } from '@oxlint/plugins'
import { corsAtEntryRule } from './rules/cors-at-entry.rule.mts'
import { declarationGroupSpacingRule } from './rules/declaration-group-spacing.rule.mts'
import { declarationJsdocRule } from './rules/declaration-jsdoc.rule.mts'
import { fileRoleFolderRule } from './rules/file-role-folder.rule.mts'
import { fileRoleSuffixRule } from './rules/file-role-suffix.rule.mts'
import { hookQueryNamingRule } from './rules/hook-query-naming.rule.mts'
import { hooksDirOnlyHooksRule } from './rules/hooks-dir-only-hooks.rule.mts'
import { inferredTypePlacementRule } from './rules/inferred-type-placement.rule.mts'
import { jsxSiblingSpacingRule } from './rules/jsx-sibling-spacing.rule.mts'
import { moduleNameRule } from './rules/module-name.rule.mts'
import { noApiOnlyImportRule } from './rules/no-api-only-import.rule.mts'
import { noBrandCastRule } from './rules/no-brand-cast.rule.mts'
import { noDefaultRuntimeRule } from './rules/no-default-runtime.rule.mts'
import { noInlineParamTypeRule } from './rules/no-inline-param-type.rule.mts'
import { noLetRule } from './rules/no-let.rule.mts'
import { noRepositoryTryCatchRule } from './rules/no-repository-try-catch.rule.mts'
import { propsWithChildrenRule } from './rules/props-with-children.rule.mts'
import { redactedSecretConfigRule } from './rules/redacted-secret-config.rule.mts'
import { taskOwnerScopeRule } from './rules/task-owner-scope.rule.mts'
import { typeParamPrefixRule } from './rules/type-param-prefix.rule.mts'

export default definePlugin({
	meta: { name: 'soonlane' },
	rules: {
		'cors-at-entry': corsAtEntryRule,
		'declaration-group-spacing': declarationGroupSpacingRule,
		'declaration-jsdoc': declarationJsdocRule,
		'file-role-folder': fileRoleFolderRule,
		'file-role-suffix': fileRoleSuffixRule,
		'hook-query-naming': hookQueryNamingRule,
		'hooks-dir-only-hooks': hooksDirOnlyHooksRule,
		'inferred-type-placement': inferredTypePlacementRule,
		'jsx-sibling-spacing': jsxSiblingSpacingRule,
		'module-name': moduleNameRule,
		'no-api-only-import': noApiOnlyImportRule,
		'no-brand-cast': noBrandCastRule,
		'no-default-runtime': noDefaultRuntimeRule,
		'no-inline-param-type': noInlineParamTypeRule,
		'no-let': noLetRule,
		'no-repository-try-catch': noRepositoryTryCatchRule,
		'props-with-children': propsWithChildrenRule,
		'redacted-secret-config': redactedSecretConfigRule,
		'task-owner-scope': taskOwnerScopeRule,
		'type-param-prefix': typeParamPrefixRule,
	},
})
