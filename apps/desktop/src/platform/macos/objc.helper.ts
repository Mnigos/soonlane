import { dlopen, FFIType } from 'bun:ffi'

// Electrobun 2.0.6 exposes no Dock badge or Accessibility API, so the shell talks to AppKit through the Objective-C runtime.

const LIBOBJC = '/usr/lib/libobjc.A.dylib'

const { objc_getClass, sel_registerName } = dlopen(LIBOBJC, {
	objc_getClass: { args: [FFIType.cstring], returns: FFIType.ptr },
	sel_registerName: { args: [FFIType.cstring], returns: FFIType.ptr },
}).symbols

/** A NUL-terminated UTF-8 copy of the text, for C string arguments. */
export function utf8(text: string) {
	return Buffer.from(`${text}\0`)
}

export function getClass(name: string) {
	return objc_getClass(utf8(name))
}

export function getSelector(name: string) {
	return sel_registerName(utf8(name))
}

/** `objc_msgSend` with the receiver, the selector and then these arguments; each method shape needs its own C signature. */
export function messageSender<
	const TArgs extends readonly FFIType[],
	TReturns extends FFIType,
>(args: TArgs, returns: TReturns) {
	return dlopen(LIBOBJC, {
		objc_msgSend: {
			args: [FFIType.ptr, FFIType.ptr, ...args] as const,
			returns,
		},
	}).symbols.objc_msgSend
}
