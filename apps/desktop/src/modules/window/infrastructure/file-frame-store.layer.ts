import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Effect, Layer, Schema } from 'effect'
import { Utils } from 'electrobun'
import { FrameStore } from '../application/frame-store.port'
import { windowFrameSchema } from '../domain/window-frame.schemas'
import { FrameStoreError } from '../domain/window.errors'

const STATE_FILE_NAME = 'window-state.json'
const decodeStoredFrame = Schema.decodeUnknownEffect(
	Schema.fromJsonString(windowFrameSchema)
)

/** Keeps the frame in `window-state.json` in the app's data folder. */
export const FileFrameStoreLive = Layer.sync(FrameStore, () => {
	const directory = Utils.paths.userData
	const stateFile = join(directory, STATE_FILE_NAME)
	const partialFile = `${stateFile}.partial`

	return FrameStore.of({
		load: Effect.try({
			try: () => readFileSync(stateFile, 'utf-8'),
			catch: cause => new FrameStoreError({ operation: 'read', cause }),
		}).pipe(Effect.flatMap(decodeStoredFrame), Effect.option),
		save: Effect.fn('FrameStore.save')(function* (frame) {
			yield* Effect.try({
				// Writing a separate file and renaming it over the old one never leaves a half-written state file.
				try: () => {
					mkdirSync(directory, { recursive: true })
					writeFileSync(partialFile, JSON.stringify(frame))
					renameSync(partialFile, stateFile)
				},
				catch: cause => new FrameStoreError({ operation: 'write', cause }),
			})
		}),
	})
})
