/** PostHog's person-property operations; the keys inside them are person properties and go out in snake_case too. */
type PersonPropertyOperation = '$set' | '$set_once'

/** A camelCase key as PostHog receives it: `dueInDays` becomes `due_in_days`. */
export type SnakeCase<TKey extends string> =
	TKey extends `${infer THead}${infer TTail}`
		? `${THead extends Lowercase<THead> ? THead : `_${Lowercase<THead>}`}${SnakeCase<TTail>}`
		: TKey

/** Event properties as PostHog receives them: keys in snake_case, `$` keys as they are, the keys inside `$set` and `$set_once` in snake_case, values untouched. */
export type SnakeCaseKeys<T> = {
	[
		TKey in keyof T as TKey extends `$${string}`
			? TKey
			: TKey extends string
				? SnakeCase<TKey>
				: TKey
	]: TKey extends PersonPropertyOperation ? SnakeCaseKeys<T[TKey]> : T[TKey]
}

/** Every key PostHog receives for a union of event properties, person properties included; an event without properties adds none. */
export type WireKey<TProperties> = TProperties extends unknown
	? string extends keyof TProperties
		? never
		:
				| keyof SnakeCaseKeys<TProperties>
				| {
						[
							TKey in keyof TProperties & PersonPropertyOperation
						]: keyof SnakeCaseKeys<TProperties[TKey]>
				  }[keyof TProperties & PersonPropertyOperation]
	: never

/** `true` when `TListed` names exactly the wire keys of `TProperties`. */
export type MatchesWireKeys<TProperties, TListed extends string> = [
	WireKey<TProperties>,
] extends [TListed]
	? [TListed] extends [WireKey<TProperties>]
		? true
		: false
	: false

/**
 * `T` once `TCheck` is `true`; `false` fails the typecheck where it is written. With `MatchesWireKeys` it keeps a
 * hand-written list of wire keys honest, so a renamed or new property cannot change what PostHog receives unnoticed.
 */
export type Checked<TCheck extends true, T> = TCheck extends true ? T : never

function toSnakeCase(key: string) {
	return key.startsWith('$')
		? key
		: key.replaceAll(/\p{Lu}/gu, letter => `_${letter.toLowerCase()}`)
}

function isPersonPropertyOperation(key: string) {
	return key === '$set' || key === '$set_once'
}

/** Renames an event's property keys for PostHog; see `SnakeCaseKeys`. */
export function toSnakeCaseKeys<T extends object>(
	properties: T
): SnakeCaseKeys<T>
export function toSnakeCaseKeys(properties: object): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(properties).map(([key, value]: [string, unknown]) => [
			toSnakeCase(key),
			isPersonPropertyOperation(key) && typeof value === 'object' && value
				? toSnakeCaseKeys(value)
				: value,
		])
	)
}
