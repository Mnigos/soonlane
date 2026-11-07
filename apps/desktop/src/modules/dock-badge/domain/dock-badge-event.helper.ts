import { Option, Schema } from 'effect'

const dockBadgeEventSchema = Schema.Struct({
	data: Schema.Struct({
		detail: Schema.Struct({
			type: Schema.Literal('dock-badge'),
			count: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
		}),
	}),
})

const decodeDockBadge = Schema.decodeUnknownOption(dockBadgeEventSchema)

export function readBadgeCount(event: unknown) {
	return decodeDockBadge(event).pipe(
		Option.map(({ data }) => data.detail.count),
		Option.getOrUndefined
	)
}
