import { Option, Schema } from 'effect'

/** The Quick Add page's `{ type: 'quick-add-done' }`: a task was added, or Escape. */
export const isQuickAddDone = Schema.is(
	Schema.Struct({ type: Schema.Literal('quick-add-done') })
)

const decodeSuggestionsToggle = Schema.decodeUnknownOption(
	Schema.Struct({
		type: Schema.Literal('quick-add-suggestions'),
		isOpen: Schema.Boolean,
	})
)

/** Whether the Quick Add page's "@" label suggestions opened or closed; undefined for any other message. */
export function readSuggestionsOpen(message: unknown) {
	return decodeSuggestionsToggle(message).pipe(
		Option.map(({ isOpen }) => isOpen),
		Option.getOrUndefined
	)
}
