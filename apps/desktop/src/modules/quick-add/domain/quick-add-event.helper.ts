import { Option, Schema } from 'effect'

/** A host-message event whose detail is the Quick Add page's `{ type: 'quick-add-done' }`: a task was added, or Escape. */
export const isQuickAddDone = Schema.is(
	Schema.Struct({
		data: Schema.Struct({
			detail: Schema.Struct({ type: Schema.Literal('quick-add-done') }),
		}),
	})
)

const decodeSuggestionsToggle = Schema.decodeUnknownOption(
	Schema.Struct({
		data: Schema.Struct({
			detail: Schema.Struct({
				type: Schema.Literal('quick-add-suggestions'),
				isOpen: Schema.Boolean,
			}),
		}),
	})
)

/** Whether the Quick Add page's "@" label suggestions opened or closed; undefined for any other event. */
export function readSuggestionsOpen(event: unknown) {
	return decodeSuggestionsToggle(event).pipe(
		Option.map(({ data }) => data.detail.isOpen),
		Option.getOrUndefined
	)
}
