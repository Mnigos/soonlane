import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { TodayScreen } from '@/modules/tasks/presentation/components/today-screen'

export default function TodayRoute() {
	const today = useToday()

	return today && <TodayScreen today={today} />
}
