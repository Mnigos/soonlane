import { Option, Schema } from 'effect'

const menuClickEventSchema = Schema.Struct({
	data: Schema.Struct({ action: Schema.String }),
})

const decodeMenuClick = Schema.decodeUnknownOption(menuClickEventSchema)

export function readMenuAction(event: unknown) {
	return decodeMenuClick(event).pipe(
		Option.map(({ data }) => data.action),
		Option.getOrUndefined
	)
}
