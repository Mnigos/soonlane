import { RuleTester } from 'oxlint/plugins-dev'
import { describe, test } from 'vitest'
import { noRepositoryTryCatchRule } from './no-repository-try-catch.rule.mts'

RuleTester.describe = describe
RuleTester.it = test

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'ts' } },
})

ruleTester.run('no-repository-try-catch', noRepositoryTryCatchRule, {
	valid: [
		'async function f() { return await db.select() }',
		'function f() { try {} finally { cleanup() } }',
		'async function f() { try { return await query() } finally { release() } }',
		'promise.finally(cleanup)',
		'db.select().then(row => row)',
		'const value = obj.catch',
		'const value = obj.then',
		'promise.catch()',
		"promise['catch'](handle)",
		"function f() { throw new Error('x') }",
		`const AlbumRepositoryLive = Layer.effect(
			AlbumRepository,
			Effect.gen(function* () {
				const db = yield* Db
				return AlbumRepository.of({
					list: ownerId =>
						db.run('AlbumRepository.list', async database =>
							await database.select().from(albums).where(eq(albums.ownerId, ownerId))
						),
				})
			})
		)`,
		'const findAll = Effect.fn("Repository.findAll")(function* () { return yield* db.run("x", run) })',
		'const value = other.catchTag',
		"const value = Effect['catchTag']",
	],
	invalid: [
		{
			code: "async function f() { try { return await db.select() } catch (cause) { throw new Error('x', { cause }) } }",
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		{
			code: 'function f() { try {} catch { return undefined } }',
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		{
			code: 'promise.catch(handle)',
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		{
			code: 'class Repository { find() { if (enabled) { try { db.select() } catch (error) { throw error } } } }',
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		{
			code: 'function f() { try {} catch {} try {} finally {} }',
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		{
			code: "function f() { return db.select().catch(cause => { throw new Error('translated', { cause }) }) }",
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		{
			code: 'db.select().then(row => row, () => undefined)',
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		{
			code: 'db.select().then(undefined, handle)',
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		{
			code: 'db.select()?.catch(handle)',
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		{
			code: 'async function f() { try { return await query() } catch (error) { throw error } finally { release() } }',
			errors: [{ messageId: 'repositoryTryCatch' }],
		},
		...[
			"db.run('x', run).pipe(Effect.catchTag('DbError', () => Effect.succeed([])))",
			"db.run('x', run).pipe(Effect.catch(() => Effect.succeed([])))",
			"db.run('x', run).pipe(Effect.orElseSucceed(() => []))",
			"db.run('x', run).pipe(Effect.mapError(cause => new AlbumNotFound()))",
			"db.run('x', run).pipe(Effect.orDie)",
			"db.run('x', run).pipe(Effect.ignore)",
			'Effect.tryPromise({ try: async () => await database.select(), catch: cause => new DbError({ cause }) })',
			"db.run('x', run).pipe(Effect.match({ onFailure: () => [], onSuccess: rows => rows }))",
		].map(code => ({
			code,
			errors: [{ messageId: 'repositoryEffectCatch' }],
		})),
	],
})
