import { cc, FFIType, JSCallback } from 'bun:ffi'
import { join } from 'node:path'

/** The bundled main script runs from `Resources/app/bun`; `electrobun.config.ts` copies the C source to `Resources/app/native`. */
const CARBON_HOT_KEY_SOURCE = join(
	import.meta.dir,
	'..',
	'native',
	'carbon-hot-key.c'
)

/** Compiles `carbon-hot-key.c` with TinyCC; Electrobun's entitlements allow the unsigned executable memory it needs. */
function compileCarbonHotKey() {
	return cc({
		source: CARBON_HOT_KEY_SOURCE,
		symbols: {
			register_hot_key: {
				args: [FFIType.u32, FFIType.u32, FFIType.function],
				returns: FFIType.ptr,
			},
			unregister_hot_key: { args: [FFIType.ptr], returns: FFIType.void },
		},
	}).symbols
}

/** Carbon modifier masks for `RegisterEventHotKey`. */
export const HOT_KEY_MODIFIERS = { option: 0x08_00 } as const
/** The virtual key code of the space bar. */
export const SPACE_KEY_CODE = 49

/**
 * Registers a system-wide hot key with the Carbon Event Manager, as Todoist
 * does: macOS hands the press only to this app, so the frontmost app never
 * types it, and no Accessibility access is needed. The registration is
 * exclusive and the app holds one. Presses arrive on the main thread, so the
 * callback is thread-safe and reaches Bun's thread later. Returns the cleanup,
 * or `undefined` when another app holds the key; throws when the C source does
 * not compile.
 */
export function registerHotKey(
	keyCode: number,
	modifiers: number,
	onPress: () => void
) {
	const carbon = compileCarbonHotKey()
	const handler = new JSCallback(() => onPress(), {
		args: [],
		returns: FFIType.void,
		threadsafe: true,
	})
	const hotKey = carbon.register_hot_key(keyCode, modifiers, handler)

	if (!hotKey) {
		handler.close()

		return undefined
	}

	return () => {
		carbon.unregister_hot_key(hotKey)
		handler.close()
	}
}
