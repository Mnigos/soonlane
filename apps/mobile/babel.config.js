/**
 * `noClassCalls` drops Babel's `_classCallCheck`, an `instanceof` test at the
 * top of every compiled constructor. oRPC's `ProcedureContract` overrides
 * `Symbol.hasInstance` and only accepts objects whose `~orpc` field is already
 * set, so the check throws "Cannot call a class as a function" while a
 * subclass such as `ContractBuilder` is still running `super()`. Hermes on
 * RN 0.81 has no native classes, so every class goes through this transform.
 */
module.exports = api => {
	api.cache(true)

	return {
		presets: [
			require.resolve('babel-preset-expo', {
				paths: [require.resolve('expo/package.json')],
			}),
		],
		assumptions: { noClassCalls: true },
	}
}
