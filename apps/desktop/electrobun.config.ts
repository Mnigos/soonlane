import { DESKTOP_URL_SCHEME } from '@soonlane/auth'
import type { ElectrobunConfig } from 'electrobun'
import productVersion from '../../version.json' with { type: 'json' }

const appUrl = process.env.APP_URL

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
			entrypoint: 'src/main.ts',
			// Bakes the build's APP_URL into the app; DesktopConfig validates it at launch.
			define: appUrl ? { 'process.env.APP_URL': JSON.stringify(appUrl) } : {},
		},
		mac: { bundleCEF: false, defaultRenderer: 'native' },
	},
	runtime: { exitOnLastWindowClosed: true },
} satisfies ElectrobunConfig
