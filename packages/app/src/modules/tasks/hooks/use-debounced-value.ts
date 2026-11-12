import { useEffect, useState } from 'react'

/** `value` once it has stopped changing for `delayMs`. */
export function useDebouncedValue(value: string, delayMs: number) {
	const [debounced, setDebounced] = useState(value)

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs)

		return () => clearTimeout(timer)
	}, [value, delayMs])

	return debounced
}
