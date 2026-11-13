import { Option, Schema } from 'effect'

const decodeDockBadge = Schema.decodeUnknownOption(
	Schema.Struct({
		type: Schema.Literal('dock-badge'),
		count: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
	})
)

/** The count of open tasks overdue or due today that a page reported for the Dock badge. */
export function readBadgeCount(message: unknown) {
	return decodeDockBadge(message).pipe(
		Option.map(({ count }) => count),
		Option.getOrUndefined
	)
}
