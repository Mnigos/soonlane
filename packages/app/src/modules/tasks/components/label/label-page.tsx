import type { CalendarDate } from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '../../../../rpc-query.client'
import { isNamed } from '../../helpers/task-view.helper'
import { TaskView } from '../view/task-view'
import { TaskViewPage } from '../view/task-view-page'

interface LabelPageProps {
	name: string
	today: CalendarDate
}

export function LabelPage({ name, today }: Readonly<LabelPageProps>) {
	const labels = useQuery(orpcQuery.labels.list.queryOptions())

	return (
		<TaskViewPage
			item={labels.data?.labels.find(label => isNamed(label, name))}
			notFoundTitle="Label not found"
			ownerList={labels}
		>
			{label => (
				<TaskView
					composer={{ defaultLabels: [label], source: 'label_view' }}
					emptyNote="No tasks with this label yet."
					filter={{ labelId: label.id }}
					id={label.id}
					name={label.name}
					ownerListKey={orpcQuery.labels.list.key()}
					today={today}
				/>
			)}
		</TaskViewPage>
	)
}
