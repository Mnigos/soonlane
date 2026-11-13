import { groupTasksByDay } from '@soonlane/app/tasks/helpers/task-list.helper'
import { useViewTasksQuery } from '@soonlane/app/tasks/hooks/use-view-tasks-query'
import type { ListTasksInput } from '@soonlane/contracts'
import { type CalendarDate, getDayHeading } from '@soonlane/domain'
import type { QueryKey } from '@tanstack/react-query'
import {
	type ComposerPreset,
	type TaskSection,
	TaskSectionList,
} from './task-section-list'

interface TaskViewProps {
	name: string
	today: CalendarDate
	filter: Pick<ListTasksInput, 'labelId' | 'projectId'>
	ownerListKey: QueryKey
	emptyNote: string
	composer: ComposerPreset
}

/** The web's label or project view: No date, Overdue, one section per day, and one "+ Add task" row at the bottom. */
export function TaskView({
	name,
	today,
	filter,
	ownerListKey,
	emptyNote,
	composer,
}: Readonly<TaskViewProps>) {
	const { data, isPending, isError } = useViewTasksQuery(
		{ ...filter, today },
		ownerListKey
	)
	const undated = data?.undated ?? []
	const overdue = data?.overdue ?? []
	const sections: TaskSection[] = [
		...(undated.length > 0
			? [
					{
						key: 'undated',
						heading: 'No date',
						count: undated.length,
						data: undated,
					},
				]
			: []),
		...(overdue.length > 0
			? [{ key: 'overdue', heading: 'Overdue', data: overdue }]
			: []),
		...[...groupTasksByDay(data?.scheduled ?? [])].map(([date, tasks]) => ({
			key: date,
			heading: getDayHeading(date, today),
			isMuted: date !== today,
			data: tasks,
		})),
	]

	return (
		<TaskSectionList
			composer={composer}
			footer={{
				isLoading: isPending,
				note: data && sections.length === 0 ? emptyNote : undefined,
				addDate: today,
			}}
			isError={isError}
			sections={sections}
			title={name}
			today={today}
		/>
	)
}
