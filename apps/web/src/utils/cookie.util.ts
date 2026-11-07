export function readCookie(cookieHeader: string, name: string) {
	return cookieHeader
		.split(';')
		.map(part => part.trim())
		.find(part => part.startsWith(`${name}=`))
		?.slice(name.length + 1)
}

/** A first-party cookie for the next SSR render; a zero lifetime deletes it (pass `domain` for a domain cookie). */
export async function saveCookie(
	name: string,
	value: string,
	maxAgeMs: number,
	domain?: string
) {
	if ('cookieStore' in window) {
		await window.cookieStore.set({
			name,
			value,
			path: '/',
			domain,
			expires: Date.now() + maxAgeMs,
			sameSite: 'lax',
		})

		return
	}

	// The Cookie Store API is missing in older browsers and on plain-http origins.
	// oxlint-disable-next-line unicorn/no-document-cookie
	document.cookie = `${name}=${value}; path=/; max-age=${Math.floor(maxAgeMs / 1000)}; samesite=lax${domain ? `; domain=${domain}` : ''}`
}
