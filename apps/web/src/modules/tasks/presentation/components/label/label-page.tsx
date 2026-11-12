import { useHostApp } from '@soonlane/app/hooks/use-host-app'
import { isLabelNamed } from '@soonlane/app/labels/helpers/label-name.helper'
import { orpcQuery } from '@soonlane/app/rpc-query'
import type { CalendarDate } from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { TaskListError } from '../list/task-list-error'
import { TaskListSkeleton } from '../list/task-list.skeleton'
import { OpenEditorProvider } from '../open-editor-provider'
import { LabelTasks } from './label-tasks'

interface LabelPageProps {
	name: string
	today: CalendarDate
}

const MAIN_CLASS = 'mx-auto w-full max-w-3xl px-6 pb-24 md:px-10'

export function LabelPage({ name, today }: Readonly<LabelPageProps>) {
	const { data, isError, refetch } = useQuery(
		orpcQuery.labels.list.queryOptions()
	)
	const label = data?.labels.find(item => isLabelNamed(item, name))
	const { homePath } = useHostApp()

	if (!data)
		return isError ? (
			<main className={MAIN_CLASS}>
				<TaskListError onRetry={() => void refetch()} />
			</main>
		) : (
			<TaskListSkeleton />
		)

	if (!label)
		return (
			<main className={MAIN_CLASS}>
				<header className="flex flex-col pt-1 md:pt-4">
					<h1 className="text-xl font-bold">Label not found</h1>

					<p className="text-label text-muted-foreground">
						It may have been renamed or deleted.
					</p>
				</header>

				<Link
					className="mt-4 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
					to={homePath}
				>
					Back to Upcoming
				</Link>
			</main>
		)

	return (
		<OpenEditorProvider key={label.id}>
			<LabelTasks label={label} today={today} />
		</OpenEditorProvider>
	)
}
