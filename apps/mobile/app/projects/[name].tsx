import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { useLocalSearchParams } from 'expo-router'
import { ProjectScreen } from '@/modules/tasks/presentation/components/project-screen'

export default function ProjectRoute() {
	const { name } = useLocalSearchParams<{ name: string }>()
	const today = useToday()

	return today && <ProjectScreen name={name} today={today} />
}
