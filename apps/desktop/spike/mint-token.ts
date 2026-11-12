/**
 * SPIKE SOON-141. Mints a desktop session the way SOON-148 would, minus the loopback redirect:
 * a browser session (dev cookie) asks for a code with the app's challenge, the "main process"
 * exchanges code + verifier without an Origin header and reads `set-auth-token`.
 * Stores the token in the macOS Keychain through `security -i` (stdin, not argv). Prints shapes only.
 */
import { createHash, randomBytes } from 'node:crypto'

const API = process.env.SPIKE_API ?? 'http://localhost:4141'
const browserCookie = process.env.SPIKE_BROWSER_COOKIE // `<name>=<value>` from dev:session
if (!browserCookie) throw new Error('SPIKE_BROWSER_COOKIE is required')

const b64url = (buffer: Buffer) => buffer.toString('base64url')
const verifier = b64url(randomBytes(32))
const challenge = b64url(createHash('sha256').update(verifier).digest())

const codeResponse = await fetch(`${API}/api/auth/desktop-sign-in/code`, {
	method: 'POST',
	headers: {
		'content-type': 'application/json',
		origin: 'http://localhost:3000',
		cookie: browserCookie,
	},
	body: JSON.stringify({ challenge }),
})
console.log('code: status', codeResponse.status)
const { code } = (await codeResponse.json()) as { code: string }

const exchange = await fetch(`${API}/api/auth/desktop-sign-in/exchange`, {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({ code, verifier }),
})
const token = exchange.headers.get('set-auth-token')
console.log('exchange: status', exchange.status)
console.log(
	'exchange: set-auth-token present',
	token !== null,
	'length',
	token?.length,
	'has dot',
	token?.includes('.'),
	'url-encoded',
	token?.includes('%')
)
console.log(
	'exchange: access-control-expose-headers',
	exchange.headers.get('access-control-expose-headers')
)
console.log(
	'exchange: set-cookie names',
	exchange.headers.getSetCookie().map(c => c.split('=')[0])
)
console.log(
	'exchange: body keys',
	Object.keys((await exchange.json()) as object)
)
if (!token) process.exit(1)

const quoted = token.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
const security = Bun.spawn(['security', '-i'], {
	stdin: 'pipe',
	stdout: 'pipe',
	stderr: 'pipe',
})
security.stdin.write(
	`add-generic-password -U -s soonlane-spike -a ${process.env.SPIKE_KEYCHAIN_ACCOUNT ?? 'desktop-session'} -w "${quoted}"\n`
)
security.stdin.end()
console.log(
	'keychain: exit',
	await security.exited,
	(await new Response(security.stderr).text()).trim()
)
