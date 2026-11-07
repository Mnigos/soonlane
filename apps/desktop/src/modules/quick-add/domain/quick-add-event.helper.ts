import { Schema } from 'effect'

/** A host-message event whose detail is the Quick Add page's `{ type: 'quick-add-done' }`: a task was added, or Escape. */
export const isQuickAddDone = Schema.is(
	Schema.Struct({
		data: Schema.Struct({
			detail: Schema.Struct({ type: Schema.Literal('quick-add-done') }),
		}),
	})
)
