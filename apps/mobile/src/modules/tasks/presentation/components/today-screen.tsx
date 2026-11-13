import { getTodayListInput } from '@soonlane/app/tasks/helpers/task-list-key.helper'
import { useTasksQuery } from '@soonlane/app/tasks/hooks/use-tasks-query'
import {
	type CalendarDate,
	formatDayMonth,
	formatWeekday,
	getDayHeading,
} from '@soonlane/domain'
import { TaskSectionList } from './task-section-list'

interface TodayScreenProps {
	today: CalendarDate
}

/** The web's Today without its Inbox and Completed sections: Overdue, then the tasks due today. */
export function TodayScreen({ today }: Readonly<TodayScreenProps>) {
	const { data, isPending, isError } = useTasksQuery(getTodayListInput(today))

	return (
		<TaskSectionList
			isError={isError}
			sections={[
				{
					key: 'overdue',
					heading: 'Overdue',
					isMuted: false,
					isLoading: isPending,
					emptyText: 'Nothing overdue.',
					data: data?.overdue ?? [],
				},
				{
					key: today,
					heading: getDayHeading(today, today),
					isMuted: false,
					isLoading: isPending,
					addDate: today,
					data: data?.scheduled ?? [],
				},
			]}
			subtitle={`${formatWeekday(today, 'long')}, ${formatDayMonth(today)}`}
			title="Today"
			today={today}
		/>
	)
}
