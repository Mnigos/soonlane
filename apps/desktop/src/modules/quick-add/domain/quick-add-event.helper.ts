import { Schema } from 'effect'

export const isQuickAddDone = Schema.is(
	Schema.Struct({
		data: Schema.Struct({
			detail: Schema.Struct({ type: Schema.Literal('quick-add-done') }),
		}),
	})
)
