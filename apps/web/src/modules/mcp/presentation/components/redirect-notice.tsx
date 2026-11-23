import { ALLOW_COPY } from '../allow-copy.constants'

function isLoopback(host: string) {
	return (
		host === 'localhost' ||
		host === '[::1]' ||
		/^127\.\d+\.\d+\.\d+$/u.test(host)
	)
}

/** The host a browser takes the answer to, or `undefined` for an app on this computer: a loopback address, or any scheme but HTTP(S), which opens a local app whatever host it names. */
function readWebHost({ protocol, hostname }: URL) {
	if (isLoopback(hostname)) return undefined
	if (protocol === 'https:' || protocol === 'http:') return hostname

	return undefined
}

interface RedirectNoticeProps {
	redirectUri?: string
}

/**
 * Where the agent's answer goes, always in view: its host, or a warning for an app on this computer, which no metadata document can prove belongs to the agent.
 * Nothing for a request without `redirect_uri`, which returns to the client's registered address, or with one that is not a URL.
 */
export function RedirectNotice({ redirectUri }: Readonly<RedirectNoticeProps>) {
	const url = redirectUri ? URL.parse(redirectUri) : null

	if (!url) return null

	const host = readWebHost(url)

	if (host) return <p>{ALLOW_COPY.redirectLine(host)}</p>

	return (
		<>
			<p>{ALLOW_COPY.redirectLineThisComputer}</p>

			<p className="font-medium text-foreground">
				{ALLOW_COPY.loopbackWarning}
			</p>
		</>
	)
}
