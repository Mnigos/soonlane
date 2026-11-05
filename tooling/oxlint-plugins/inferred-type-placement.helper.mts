import type { ESTree } from '@oxlint/plugins'

export type ProgramStatement = ESTree.Program['body'][number]

export interface InferredAlias {
	name: string
	source: string
	sourceIndex: number
}

const DRIZZLE_INFER_PROPERTIES = new Set(['$inferSelect', '$inferInsert'])
const ZOD_INFER_HELPERS = new Set(['infer', 'input', 'output'])
const ZOD_MODULE_PATTERN = /^zod(?:\/|$)/

function unwrapExport(statement: ProgramStatement) {
	return statement.type === 'ExportNamedDeclaration'
		? (statement.declaration ?? undefined)
		: statement
}

function getImportedName({ imported }: ESTree.ImportSpecifier) {
	return imported.type === 'Identifier' ? imported.name : imported.value
}

function getZodInferNames(specifier: ESTree.ImportDeclarationSpecifier) {
	const { name } = specifier.local
	const helpers = [...ZOD_INFER_HELPERS]

	if (specifier.type === 'ImportNamespaceSpecifier')
		return helpers.flatMap(helper => [
			`${name}.${helper}`,
			`${name}.z.${helper}`,
		])
	if (
		specifier.type === 'ImportDefaultSpecifier' ||
		getImportedName(specifier) === 'z'
	)
		return helpers.map(helper => `${name}.${helper}`)

	return ZOD_INFER_HELPERS.has(getImportedName(specifier)) ? [name] : []
}

function getZodInferTypeNames({ body }: ESTree.Program) {
	return new Set(
		body.flatMap(statement =>
			statement.type === 'ImportDeclaration' &&
			ZOD_MODULE_PATTERN.test(statement.source.value)
				? statement.specifiers.flatMap(getZodInferNames)
				: []
		)
	)
}

function getTypeNameText(typeName: ESTree.TSTypeName): string | undefined {
	if (typeName.type === 'Identifier') return typeName.name
	if (typeName.type !== 'TSQualifiedName') return

	const left = getTypeNameText(typeName.left)

	return left && `${left}.${typeName.right.name}`
}

function getInferredSource(
	type: ESTree.TSType,
	zodInferTypeNames: ReadonlySet<string>
) {
	if (type.type === 'TSTypeQuery') {
		const { exprName } = type

		return exprName.type === 'TSQualifiedName' &&
			exprName.left.type === 'Identifier' &&
			DRIZZLE_INFER_PROPERTIES.has(exprName.right.name)
			? exprName.left.name
			: undefined
	}
	if (type.type !== 'TSTypeReference') return

	const typeNameText = getTypeNameText(type.typeName)
	const [argument, ...rest] = type.typeArguments?.params ?? []

	if (
		typeNameText &&
		zodInferTypeNames.has(typeNameText) &&
		rest.length === 0 &&
		argument?.type === 'TSTypeQuery' &&
		argument.exprName.type === 'Identifier'
	)
		return argument.exprName.name
}

function getDeclaredNames(statement: ProgramStatement) {
	const declaration = unwrapExport(statement)

	if (declaration?.type !== 'VariableDeclaration') return []

	return declaration.declarations.flatMap(declarator =>
		declarator.id.type === 'Identifier' ? [declarator.id.name] : []
	)
}

function getInferredAlias(
	statement: ProgramStatement,
	zodInferTypeNames: ReadonlySet<string>,
	declarationIndexes: ReadonlyMap<string, number>
): InferredAlias | undefined {
	const declaration = unwrapExport(statement)

	if (declaration?.type !== 'TSTypeAliasDeclaration') return

	const source = getInferredSource(
		declaration.typeAnnotation,
		zodInferTypeNames
	)
	const sourceIndex = source ? declarationIndexes.get(source) : undefined

	if (source && sourceIndex !== undefined)
		return { name: declaration.id.name, source, sourceIndex }
}

/**
 * Maps each module-level statement to the type alias it declares when the
 * alias is exactly `typeof table.$inferSelect`/`$inferInsert` or a Zod
 * `infer`/`input`/`output` of `typeof schema` (through `z`, a renamed `z`, a
 * default or namespace import including `ns.z`, or a named helper import) and
 * its source is a simple identifier bound by a module-level variable
 * declaration of the same file; every other statement maps to `undefined`.
 */
export function getInferredAliases(program: ESTree.Program) {
	const zodInferTypeNames = getZodInferTypeNames(program)
	const declarationIndexes = new Map(
		program.body.flatMap((statement, index) =>
			getDeclaredNames(statement).map(name => [name, index] as const)
		)
	)

	return program.body.map(statement =>
		getInferredAlias(statement, zodInferTypeNames, declarationIndexes)
	)
}
