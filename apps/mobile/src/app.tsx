import './global.css'
import { provideRpcLink } from '@soonlane/app/rpc-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'react-native'
import { rpcLink } from './rpc-link.client'
import { TodayScreen } from './today-screen'
import { TodayScreenNativewind } from './today-screen-nativewind'

provideRpcLink(rpcLink)

const queryClient = new QueryClient({
	defaultOptions: { queries: { retry: false } },
})
/** Spike switch between the two styling variants; Metro inlines it at start. */
const showNativewind =
	(process.env as Record<string, string | undefined>)
		.EXPO_PUBLIC_SPIKE_STYLING === 'nativewind'

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<StatusBar barStyle="light-content" />

			{showNativewind ? <TodayScreenNativewind /> : <TodayScreen />}
		</QueryClientProvider>
	)
}
