import { provideRpcLink } from '@soonlane/app/rpc-query'
import { DarkTheme, Stack, ThemeProvider } from 'expo-router'
import { rpcLink } from '@/platform/rpc/rpc.client'
import { COLORS } from '@/tokens.gen'

provideRpcLink(rpcLink)

const THEME = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		primary: COLORS.foreground,
		background: COLORS.background,
		card: COLORS.background,
		text: COLORS.foreground,
		border: COLORS.border,
		notification: COLORS.primary,
	},
}

export default function RootLayout() {
	return (
		<ThemeProvider value={THEME}>
			<Stack
				screenOptions={{
					headerBackButtonDisplayMode: 'minimal',
					headerShadowVisible: false,
					title: '',
				}}
			>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
			</Stack>
		</ThemeProvider>
	)
}
