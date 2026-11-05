import { RuleTester } from 'oxlint/plugins-dev'
import { describe, test } from 'vitest'
import { typeParamPrefixRule } from './type-param-prefix.rule.mts'

RuleTester.describe = describe
RuleTester.it = test

const ruleTester = new RuleTester({
	languageOptions: { parserOptions: { lang: 'ts' } },
})

ruleTester.run('type-param-prefix', typeParamPrefixRule, {
	valid: [
		'function f<T>(x: T) {}',
		'type A<TItem, TKey extends keyof TItem> = TItem[TKey]',
		'interface I<TOperationResult = unknown> {}',
		'class C<TValue> {}',
		'const f = <TData,>(x: TData) => x',
		'type M<T> = { [TKey in keyof T]: T[TKey] }',
		'type E<T> = T extends (infer TElement)[] ? TElement : T',
		'type X = Array<Item>',
	],
	invalid: [
		{
			code: 'function f<Item>() {}',
			errors: [{ messageId: 'missingTypeParamPrefix', data: { name: 'Item' } }],
		},
		{
			code: 'type A<K> = K',
			errors: [{ messageId: 'missingTypeParamPrefix', data: { name: 'K' } }],
		},
		{
			code: 'interface I<Value> {}',
			errors: [
				{ messageId: 'missingTypeParamPrefix', data: { name: 'Value' } },
			],
		},
		{
			code: 'class C<U> {}',
			errors: [{ messageId: 'missingTypeParamPrefix', data: { name: 'U' } }],
		},
		{
			code: '<V,>(x: V) => x',
			errors: [{ messageId: 'missingTypeParamPrefix', data: { name: 'V' } }],
		},
		{
			code: 'type M<T> = { [K in keyof T]: T[K] }',
			errors: [{ messageId: 'missingTypeParamPrefix', data: { name: 'K' } }],
		},
		{
			code: 'type E<T> = T extends (infer U)[] ? U : T',
			errors: [{ messageId: 'missingTypeParamPrefix', data: { name: 'U' } }],
		},
		{
			code: 'function f<Tvalue>() {}',
			errors: [
				{ messageId: 'missingTypeParamPrefix', data: { name: 'Tvalue' } },
			],
		},
		{
			code: 'function f<T1>() {}',
			errors: [{ messageId: 'missingTypeParamPrefix', data: { name: 'T1' } }],
		},
		{
			code: 'function f<TItem, Key>() {}',
			errors: [{ messageId: 'missingTypeParamPrefix', data: { name: 'Key' } }],
		},
		{
			code: 'type A<X> = { [K in keyof X]: X[K] }',
			errors: [
				{ messageId: 'missingTypeParamPrefix', data: { name: 'X' } },
				{ messageId: 'missingTypeParamPrefix', data: { name: 'K' } },
			],
		},
	],
})
