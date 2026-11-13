import { orpcQuery } from '@soonlane/app/rpc-query'
import { isNamed } from '@soonlane/app/tasks/helpers/task-view.helper'
import type { CalendarDate } from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'
import { TaskView } from './task-view'
import { TaskViewScreen } from './task-view-screen'

interface LabelScreenProps {
	name: string
	today: CalendarDate
}

export function LabelScreen({ name, today }: Readonly<LabelScreenProps>) {
	const labels = useQuery(orpcQuery.labels.list.queryOptions())

	return (
		<TaskViewScreen
			item={labels.data?.labels.find(label => isNamed(label, name))}
			name={name}
			notFoundTitle="Label not found"
			ownerList={labels}
			today={today}
		>
			{label => (
				<TaskView
					composer={{ defaultLabels: [label], source: 'label_view' }}
					emptyNote="No tasks with this label yet."
					filter={{ labelId: label.id }}
					name={label.name}
					ownerListKey={orpcQuery.labels.list.key()}
					today={today}
				/>
			)}
		</TaskViewScreen>
	)
}
