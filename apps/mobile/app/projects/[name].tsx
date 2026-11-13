import { useLocalSearchParams } from 'expo-router'
import { PlaceholderScreen } from '@/modules/shell/presentation/components/placeholder-screen'

export default function ProjectRoute() {
	const { name } = useLocalSearchParams<{ name: string }>()

	return (
		<PlaceholderScreen
			title={name}
			description="Tasks in this project will appear here."
		/>
	)
}
