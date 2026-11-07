import { Option, Schema } from 'effect'

const openUrlEventSchema = Schema.Struct({
	data: Schema.Struct({ url: Schema.String }),
})

const decodeOpenUrl = Schema.decodeUnknownOption(openUrlEventSchema)

/** The URL macOS opened the app with (a `soonlane://` link). */
export function readOpenedUrl(event: unknown) {
	return decodeOpenUrl(event).pipe(
		Option.map(({ data }) => data.url),
		Option.getOrUndefined
	)
}
