/** The value of cookie `name` in a `Cookie` request header, or `undefined`. */
export function readCookie(cookieHeader: string, name: string) {
	return cookieHeader
		.split(';')
		.map(part => part.trim())
		.find(part => part.startsWith(`${name}=`))
		?.slice(name.length + 1)
}
