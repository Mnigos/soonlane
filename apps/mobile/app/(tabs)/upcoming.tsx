import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { UpcomingScreen } from '@/modules/tasks/presentation/components/upcoming-screen'

export default function UpcomingRoute() {
	const today = useToday()

	// A new day remounts the screen, so the loaded weeks start again from the new today, as on the web.
	return today && <UpcomingScreen key={today} today={today} />
}
