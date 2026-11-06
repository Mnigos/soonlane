import { DESKTOP_URL_SCHEME } from '@soonlane/auth'
import type { ElectrobunConfig } from 'electrobun'
import productVersion from '../../version.json' with { type: 'json' }

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
		bun: { entrypoint: 'src/main.ts' },
		mac: { bundleCEF: false, defaultRenderer: 'native' },
	},
	runtime: { exitOnLastWindowClosed: true },
} satisfies ElectrobunConfig
