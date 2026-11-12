/** SPIKE SOON-141: main process for the bundled page. Not production code. */
import { BrowserView, BrowserWindow, Utils } from 'electrobun'
import type { SpikeRpc } from '../../../spike/view/rpc-schema'

const FRAME = { x: 120, y: 120, width: 900, height: 700 }
const account = process.env.SPIKE_KEYCHAIN_ACCOUNT ?? 'desktop-session'

/** The main process reads the token from the login Keychain; it never lands in a file or the page's storage. */
async function readToken() {
	const security = Bun.spawn(
		[
			'security',
			'find-generic-password',
			'-s',
			'soonlane-spike',
			'-a',
			account,
			'-w',
		],
		{
			stdout: 'pipe',
			stderr: 'pipe',
		}
	)
	const [code, out] = await Promise.all([
		security.exited,
		new Response(security.stdout).text(),
	])
	console.log('[main] keychain read exit', code)
	return code === 0 ? out.trim() : null
}

let shot = false

const rpc = BrowserView.defineRPC<SpikeRpc>({
	handlers: {
		requests: {
			getSessionToken: async () => {
				console.log('[main] page asked for the token')
				return await readToken()
			},
		},
		messages: {
			report: ({ step, data }) => {
				console.log('[page]', step, JSON.stringify(data))
				if (
					step === 'dom' &&
					typeof data === 'string' &&
					data.includes('Spike:') &&
					!shot
				) {
					shot = true
					setTimeout(() => {
						Bun.spawnSync([
							'screencapture',
							'-x',
							'-R',
							`${FRAME.x},${FRAME.y},${FRAME.width},${FRAME.height}`,
							'/tmp/soon141-evidence/today-window.png',
						])
						console.log('[main] screenshot taken')
						setTimeout(() => Utils.quit(0), 500)
					}, 800)
				}
			},
		},
	},
})

new BrowserWindow({
	title: 'Soonlane spike',
	url: 'views://app/index.html',
	frame: FRAME,
	rpc,
})
setTimeout(
	() => {
		console.log('[main] timeout, quitting')
		Utils.quit(1)
	},
	Number(process.env.SPIKE_TIMEOUT_MS ?? 30000)
)
