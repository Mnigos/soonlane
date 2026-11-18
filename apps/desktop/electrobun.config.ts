import type { ElectrobunConfig } from 'electrobun'
import productVersion from '../../version.json' with { type: 'json' }
import { APP_IDENTIFIER } from './src/platform/config/desktop.constants'

const { APP_URL, API_URL, ELECTROBUN_DEVELOPER_ID } = process.env
/** Signed and notarized only where the release workflow provides Igor's Developer ID; pull request and local builds stay unsigned. */
const isSigned = Boolean(ELECTROBUN_DEVELOPER_ID)

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
			// Bakes the build's APP_URL, API_URL and whether it updates itself into the app; DesktopConfig validates them at launch.
			define: {
				...(APP_URL && { 'process.env.APP_URL': JSON.stringify(APP_URL) }),
				...(API_URL && { 'process.env.API_URL': JSON.stringify(API_URL) }),
				'process.env.DESKTOP_UPDATES': JSON.stringify(String(isSigned)),
			},
		},
		// The page Vite builds into dist/view (`bun run view`), served as views://app.
		copy: {
			'dist/view/index.html': 'views/app/index.html',
			'dist/view/assets': 'views/app/assets',
			// Compiled at launch by carbon-hot-key.helper.ts.
			'src/platform/macos/carbon-hot-key.c': 'native/carbon-hot-key.c',
		},
		mac: {
			bundleCEF: false,
			defaultRenderer: 'native',
			// Drawn from the web favicon by `bun run icon`, which `package` and `dev` run first.
			icons: '.cache/icon.iconset',
			codesign: isSigned,
			notarize: isSigned,
		},
	},
	// The updater reads the stable channel's manifest and patches from the latest GitHub Release's assets.
	release: {
		baseUrl: 'https://github.com/Mnigos/soonlane/releases/latest/download',
	},
	runtime: { exitOnLastWindowClosed: true },
} satisfies ElectrobunConfig
