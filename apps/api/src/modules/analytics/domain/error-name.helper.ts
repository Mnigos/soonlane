/** Only the name: driver errors embed SQL parameters, and fetch failures can carry a URL or a header. */
export function toErrorName(error: unknown) {
	return error instanceof Error ? error.name : typeof error
}
