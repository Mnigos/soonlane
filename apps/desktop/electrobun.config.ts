import type { ElectrobunConfig } from 'electrobun'
import productVersion from '../../version.json' with { type: 'json' }

export default {
	app: {
		name: 'Soonlane',
		identifier: 'com.mnigos.soonlane',
		version: productVersion.version,
	},
	build: {
		mainProcess: 'bun',
		bun: { entrypoint: 'src/main.ts' },
		mac: { bundleCEF: false, defaultRenderer: 'native' },
	},
	runtime: { exitOnLastWindowClosed: true },
} satisfies ElectrobunConfig
