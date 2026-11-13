import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import { SearchScreen } from '@/modules/tasks/presentation/components/search-screen'

export default function SearchRoute() {
	const today = useToday()

	return today && <SearchScreen today={today} />
}
