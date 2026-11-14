import type { ConfigContext } from 'expo/config'
import productVersion from '../../version.json' with { type: 'json' }
import { COLORS } from './src/tokens.gen.ts'

/** The profile's web host; Android verifies it through its `assetlinks.json` and hands this app only its sign-in callback. */
const WEB_HOST = URL.parse(process.env.EXPO_PUBLIC_WEB_URL ?? '')?.host
/** `ANDROID_CALLBACK_PATH` from `@soonlane/auth`, whose extensionless imports Expo's config loader cannot resolve. */
const ANDROID_CALLBACK_PATH = '/android/callback'

/** app.json plus what lives in other files: the store version from version.json (EAS numbers the builds), the splash and root view colors from the tokens and the profile's App Link host. */
export default function appConfig({
	config,
}: ConfigContext): ConfigContext['config'] {
	return {
		...config,
		version: productVersion.version,
		// expo-system-ui paints the root view with it; without it iOS turns black under the dark style.
		backgroundColor: COLORS.background,
		android: {
			...config.android,
			// One host per build: Android 11 and older verify all of an app's hosts or none.
			intentFilters: WEB_HOST
				? [
						{
							action: 'VIEW',
							autoVerify: true,
							data: [
								{
									scheme: 'https',
									host: WEB_HOST,
									path: ANDROID_CALLBACK_PATH,
								},
							],
							category: ['BROWSABLE', 'DEFAULT'],
						},
					]
				: [],
		},
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
