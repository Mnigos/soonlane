import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { useLocalSearchParams } from 'expo-router'
import { TaskDetailsScreen } from '@/modules/tasks/presentation/components/task-details-screen'

export default function TaskRoute() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const today = useToday()

	return today && <TaskDetailsScreen id={id} today={today} />
}
