import { Option, Schema } from 'effect'

const newWindowOpenEventSchema = Schema.Struct({
	data: Schema.Struct({
		// A JSON object from the page's bridge, or the bare URL when Electrobun could not parse it.
		detail: Schema.Union([
			Schema.String,
			Schema.Struct({ url: Schema.String }),
		]),
	}),
})

/** A will-navigate event's detail is JSON: `{ url, allowed }`, where `allowed` is the navigation rules' verdict. */
const willNavigateEventSchema = Schema.Struct({
	data: Schema.Struct({
		detail: Schema.fromJsonString(
			Schema.Struct({ url: Schema.String, allowed: Schema.Boolean })
		),
	}),
})

const decodeNewWindowOpen = Schema.decodeUnknownOption(newWindowOpenEventSchema)
const decodeWillNavigate = Schema.decodeUnknownOption(willNavigateEventSchema)

/** The URL a `target=_blank` link, `window.open` or Cmd+click asks for. */
export function readNewWindowUrl(event: unknown) {
	return decodeNewWindowOpen(event).pipe(
		Option.map(({ data: { detail } }) =>
			typeof detail === 'string' ? detail : detail.url
		),
		Option.getOrUndefined
	)
}

/** The URL of a top-level navigation that the navigation rules blocked. */
export function readBlockedNavigationUrl(event: unknown) {
	return decodeWillNavigate(event).pipe(
		Option.filter(({ data: { detail } }) => !detail.allowed),
		Option.map(({ data: { detail } }) => detail.url),
		Option.getOrUndefined
	)
}
