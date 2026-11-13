import { dlopen, FFIType, JSCallback, ptr } from 'bun:ffi'

const CARBON = '/System/Library/Frameworks/Carbon.framework/Carbon'
/** `'keyb'`, the Carbon Event Manager's keyboard event class. */
const EVENT_CLASS_KEYBOARD = 0x6b_65_79_62
const EVENT_HOT_KEY_PRESSED = 5
/** `'SNLN'`: marks this app's hot keys. */
const HOT_KEY_SIGNATURE = 0x53_4e_4c_4e
const NO_ERROR = 0

/** EventHotKeyID `{ signature, id }` as the one little-endian 64-bit value arm64 passes it in. */
function toHotKeyId(id: number) {
	const view = new DataView(new ArrayBuffer(8))

	view.setUint32(0, HOT_KEY_SIGNATURE, true)
	view.setUint32(4, id, true)

	return view.getBigUint64(0, true)
}

const {
	GetApplicationEventTarget,
	InstallEventHandler,
	RegisterEventHotKey,
	RemoveEventHandler,
	UnregisterEventHotKey,
} = dlopen(CARBON, {
	GetApplicationEventTarget: { args: [], returns: FFIType.ptr },
	InstallEventHandler: {
		args: [
			FFIType.ptr,
			FFIType.function,
			FFIType.u32,
			FFIType.ptr,
			FFIType.ptr,
			FFIType.ptr,
		],
		returns: FFIType.i32,
	},
	// EventHotKeyID ({ signature, id }, 8 bytes) is passed by value, in one register on arm64.
	RegisterEventHotKey: {
		args: [
			FFIType.u32,
			FFIType.u32,
			FFIType.u64,
			FFIType.ptr,
			FFIType.u32,
			FFIType.ptr,
		],
		returns: FFIType.i32,
	},
	// The refs the two calls above wrote, passed back as the 64-bit values they are.
	RemoveEventHandler: { args: [FFIType.u64], returns: FFIType.i32 },
	UnregisterEventHotKey: { args: [FFIType.u64], returns: FFIType.i32 },
}).symbols

/** Carbon modifier masks for `RegisterEventHotKey`. */
export const HOT_KEY_MODIFIERS = { option: 0x08_00 } as const
/** The virtual key code of the space bar. */
export const SPACE_KEY_CODE = 49

/**
 * Registers a system-wide hot key with the Carbon Event Manager, as Todoist
 * does: macOS hands the press only to this app, so the frontmost app never
 * types it, and no Accessibility access is needed. The handler runs on the
 * main thread, so the callback is thread-safe and reaches Bun's thread later.
 * Returns the cleanup, or `undefined` when another app already holds the key.
 */
export function registerHotKey(
	keyCode: number,
	modifiers: number,
	onPress: () => void
) {
	const handler = new JSCallback(() => onPress(), {
		args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
		returns: FFIType.void,
		threadsafe: true,
	})
	const eventTypes = new Uint32Array([
		EVENT_CLASS_KEYBOARD,
		EVENT_HOT_KEY_PRESSED,
	])
	const handlerRef = new BigUint64Array(1)
	const hotKeyRef = new BigUint64Array(1)
	const target = GetApplicationEventTarget()
	const installed = InstallEventHandler(
		target,
		handler,
		1,
		ptr(eventTypes),
		null,
		ptr(handlerRef)
	)
	const registered =
		installed === NO_ERROR &&
		RegisterEventHotKey(
			keyCode,
			modifiers,
			toHotKeyId(1),
			target,
			0,
			ptr(hotKeyRef)
		) === NO_ERROR

	const removeHandler = () => {
		if (installed === NO_ERROR) RemoveEventHandler(handlerRef.at(0) ?? 0n)
		handler.close()
	}

	if (!registered) {
		removeHandler()

		return undefined
	}

	return () => {
		UnregisterEventHotKey(hotKeyRef.at(0) ?? 0n)
		removeHandler()
	}
}
