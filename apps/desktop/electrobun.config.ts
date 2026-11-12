import { DESKTOP_URL_SCHEME } from '@soonlane/auth'
import type { ElectrobunConfig } from 'electrobun'
import productVersion from '../../version.json' with { type: 'json' }

const appUrl = process.env.APP_URL
/** SPIKE SOON-141: SPIKE_MAIN=1 builds the bundled-page spike instead of the app. */
const spike = process.env.SPIKE_MAIN === '1'

export default {
	app: {
		name: 'Soonlane',
		identifier: 'com.mnigos.soonlane',
		version: productVersion.version,
		// macOS registers the scheme only for a copy of the app in /Applications.
		urlSchemes: [DESKTOP_URL_SCHEME],
	},
	build: {
		mainProcess: 'bun',
		bun: {
			entrypoint: spike
				? 'src/platform/electrobun/spike-main.ts'
				: 'src/main.ts',
			// Bakes the build's APP_URL into the app; DesktopConfig validates it at launch.
			define: appUrl ? { 'process.env.APP_URL': JSON.stringify(appUrl) } : {},
		},
		...(spike ? { copy: { 'spike/view/dist': 'views/app' } } : {}),
		mac: { bundleCEF: false, defaultRenderer: 'native' },
	},
	runtime: { exitOnLastWindowClosed: true },
} satisfies ElectrobunConfig
