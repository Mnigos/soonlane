import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { useLocalSearchParams } from 'expo-router'
import { LabelScreen } from '@/modules/tasks/presentation/components/label-screen'

export default function LabelRoute() {
	const { name } = useLocalSearchParams<{ name: string }>()
	const today = useToday()

	return today && <LabelScreen name={name} today={today} />
}
