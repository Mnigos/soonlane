import { APP_PATHS } from '@soonlane/app/app-paths'
import { CompletedPage } from '@soonlane/app/tasks/components/completed/completed-page'
import { InboxPage } from '@soonlane/app/tasks/components/inbox-page'
import { LabelPage } from '@soonlane/app/tasks/components/label/label-page'
import { TaskListSkeleton } from '@soonlane/app/tasks/components/list/task-list.skeleton'
import { ProjectPage } from '@soonlane/app/tasks/components/project/project-page'
import { SearchPage } from '@soonlane/app/tasks/components/search/search-page'
import { TodayPage } from '@soonlane/app/tasks/components/today-page'
import { UpcomingPage } from '@soonlane/app/tasks/components/upcoming/upcoming-page'
import { useToday } from '@soonlane/app/tasks/hooks/use-today'
import type { CalendarDate } from '@soonlane/domain'
import { createRoute, useLocation, useParams } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { z } from 'zod'
import { shellRoute } from '../../../shell/presentation/routes/shell.route'

/** The search palette's query, handed over in navigation state so it never reaches the URL. */
const searchStateSchema = z.object({
	searchQuery: z.string().optional().catch(undefined),
	handoffId: z.string().optional().catch(undefined),
})

/** Renders a view once the local day is known; a new day remounts it, as on the web. */
function OnToday({
	render,
}: Readonly<{ render: (today: CalendarDate) => ReactElement }>) {
	const today = useToday()

	return today ? render(today) : <TaskListSkeleton />
}

function viewRoute<TPath extends string>(
	path: TPath,
	render: (today: CalendarDate) => ReactElement
) {
	return createRoute({
		getParentRoute: () => shellRoute,
		path,
		component: () => <OnToday render={render} />,
	})
}

function SearchView({ today }: Readonly<{ today: CalendarDate }>) {
	const { searchQuery, handoffId } = useLocation({
		select: location => searchStateSchema.parse(location.state),
	})

	return <SearchPage initialQuery={searchQuery} key={handoffId} today={today} />
}

function NamedView({
	today,
	kind,
}: Readonly<{ today: CalendarDate; kind: 'label' | 'project' }>) {
	const { name } = useParams({ strict: false })

	if (!name) return null

	return kind === 'label' ? (
		<LabelPage key={today} name={name} today={today} />
	) : (
		<ProjectPage key={today} name={name} today={today} />
	)
}

export const taskViewRoutes = [
	viewRoute(APP_PATHS.upcoming, today => (
		<UpcomingPage key={today} today={today} />
	)),
	viewRoute(APP_PATHS.inbox, today => <InboxPage today={today} />),
	viewRoute(APP_PATHS.today, today => <TodayPage today={today} />),
	viewRoute(APP_PATHS.search, today => <SearchView today={today} />),
	viewRoute(APP_PATHS.completed, today => <CompletedPage today={today} />),
	viewRoute(APP_PATHS.label, today => <NamedView kind="label" today={today} />),
	viewRoute(APP_PATHS.project, today => (
		<NamedView kind="project" today={today} />
	)),
]
