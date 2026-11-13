import type { ElectrobunConfig } from 'electrobun'
import productVersion from '../../version.json' with { type: 'json' }
import { APP_IDENTIFIER } from './src/platform/config/desktop.constants'

const { APP_URL, API_URL } = process.env

export default {
	app: {
		name: 'Soonlane',
		identifier: APP_IDENTIFIER,
		version: productVersion.version,
	},
	build: {
		mainProcess: 'bun',
		bun: {
			entrypoint: 'src/main.ts',
			// Bakes the build's APP_URL and API_URL into the app; DesktopConfig validates them at launch.
			define: {
				...(APP_URL && { 'process.env.APP_URL': JSON.stringify(APP_URL) }),
				...(API_URL && { 'process.env.API_URL': JSON.stringify(API_URL) }),
			},
		},
		// The page Vite builds into dist/view (`bun run view`), served as views://app.
		copy: {
			'dist/view/index.html': 'views/app/index.html',
			'dist/view/assets': 'views/app/assets',
		},
		mac: { bundleCEF: false, defaultRenderer: 'native' },
	},
	runtime: { exitOnLastWindowClosed: true },
} satisfies ElectrobunConfig
