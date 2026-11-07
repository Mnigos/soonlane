import { Option, Schema } from 'effect'

/** A host-message event whose detail is the page's `{ type: 'dock-badge', count }`. */
const dockBadgeEventSchema = Schema.Struct({
	data: Schema.Struct({
		detail: Schema.Struct({
			type: Schema.Literal('dock-badge'),
			count: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
		}),
	}),
})

const decodeDockBadge = Schema.decodeUnknownOption(dockBadgeEventSchema)

/** The count of open tasks overdue or due today that a page reported for the Dock badge. */
export function readBadgeCount(event: unknown) {
	return decodeDockBadge(event).pipe(
		Option.map(({ data }) => data.detail.count),
		Option.getOrUndefined
	)
}
