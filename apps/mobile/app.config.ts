import type { ConfigContext } from 'expo/config'
import productVersion from '../../version.json' with { type: 'json' }
import { COLORS } from './src/tokens.gen.ts'

/** app.json plus what lives in other files: the store version from version.json (EAS numbers the builds) and the splash color from the tokens. */
export default function appConfig({
	config,
}: ConfigContext): ConfigContext['config'] {
	return {
		...config,
		version: productVersion.version,
		plugins: [
			...(config.plugins ?? []),
			[
				'expo-splash-screen',
				{
					image: './assets/splash-icon.png',
					imageWidth: 120,
					backgroundColor: COLORS.background,
				},
			],
		],
	}
}
