// Hermes has no Array.prototype.toSorted, which the shared list helpers use for optimistic updates.
import 'core-js/stable/array/to-sorted'
import { provideHostPorts } from '@soonlane/app/host-ports'
import { provideRpcLink } from '@soonlane/app/rpc-query'
import {
	focusManager,
	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query'
import { DarkTheme, Stack, ThemeProvider } from 'expo-router'
import { AppState } from 'react-native'
import { Toast } from '@/modules/shell/presentation/components/toast'
import {
	dismissToast,
	hideToast,
	showToast,
} from '@/modules/shell/presentation/toast.client'
import { authClient } from '@/platform/auth/auth.client'
import { rpcLink } from '@/platform/rpc/rpc.client'
import { COLORS } from '@/tokens.gen'

/** Calls back with whether the app is in the foreground whenever that changes; returns the unsubscribe. */
function subscribeToForeground(onChange: (isActive: boolean) => void) {
	const subscription = AppState.addEventListener('change', state =>
		onChange(state === 'active')
	)

	return () => subscription.remove()
}

provideRpcLink(rpcLink)
provideHostPorts({
	showToast,
	dismissToast,
	// Analytics waits for consent (SOON-175).
	capture: () => undefined,
	subscribeToResume: onResume =>
		subscribeToForeground(isActive => {
			if (isActive) onResume()
		}),
})
focusManager.setEventListener(subscribeToForeground)

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
const queryClient = new QueryClient()

type SessionState = ReturnType<typeof authClient.useSession>

/** Set once the first session lookup settles, so later re-checks never unmount the navigator. */
let hasResolvedSession = false

/** Runs before the layout re-renders; only a change of user, or its end, clears the cache and the toast's Undo, never a late reply. */
authClient.$store.atoms.session?.listen(
	(next: SessionState, previous: SessionState) => {
		if (!next.isPending || next.data) hasResolvedSession = true
		if (next.data?.user.id === previous.data?.user.id) return

		queryClient.clear()
		hideToast()
	}
)

/** A signed-out user reaches only the sign-in screen; a session restored from the Keychain opens the app before the API confirms it. */
export default function RootLayout() {
	const { data: session } = authClient.useSession()
	const isSignedIn = session !== null

	if (!hasResolvedSession) return null

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider value={THEME}>
				<Stack
					screenOptions={{
						headerBackButtonDisplayMode: 'minimal',
						headerShadowVisible: false,
						title: '',
					}}
				>
					<Stack.Protected guard={isSignedIn}>
						<Stack.Screen name="(tabs)" options={{ headerShown: false }} />

						<Stack.Screen name="settings" />

						<Stack.Screen name="labels/[name]" />

						<Stack.Screen name="projects/[name]" />
					</Stack.Protected>

					<Stack.Protected guard={!isSignedIn}>
						<Stack.Screen name="sign-in" options={{ headerShown: false }} />
					</Stack.Protected>
				</Stack>

				<Toast />
			</ThemeProvider>
		</QueryClientProvider>
	)
}
