import { provideRpcLink } from '@soonlane/app/rpc-query'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StatusBar } from 'react-native'
import { rpcLink } from './rpc-link.client'
import { TodayScreen } from './today-screen'

provideRpcLink(rpcLink)

const queryClient = new QueryClient({
	defaultOptions: { queries: { retry: false } },
})

export function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<StatusBar barStyle="light-content" />

			<TodayScreen />
		</QueryClientProvider>
	)
}
