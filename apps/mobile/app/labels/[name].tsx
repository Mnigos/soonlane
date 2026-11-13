import { useLocalSearchParams } from 'expo-router'
import { PlaceholderScreen } from '@/modules/shell/presentation/components/placeholder-screen'

export default function LabelRoute() {
	const { name } = useLocalSearchParams<{ name: string }>()

	return (
		<PlaceholderScreen
			title={name}
			description="Tasks with this label will appear here."
		/>
	)
}
