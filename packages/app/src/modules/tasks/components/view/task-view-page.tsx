import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useHostApp } from '../../../../hooks/use-host-app'
import { TaskListError } from '../list/task-list-error'
import { TaskListSkeleton } from '../list/task-list.skeleton'
import { OpenEditorProvider } from '../open-editor-provider'

interface TaskViewPageProps<TItem extends { id: string }> {
	/** The query of the list the view's label is found in. */
	ownerList: { data: unknown; isError: boolean; refetch: () => unknown }
	item: TItem | undefined
	notFoundTitle: string
	children: (item: TItem) => ReactNode
}

const MAIN_CLASS = 'mx-auto w-full max-w-3xl px-6 pb-24 md:px-10'

/** Waits for the owner list, then shows the view of the item found in it or a not-found page. */
export function TaskViewPage<TItem extends { id: string }>({
	ownerList,
	item,
	notFoundTitle,
	children,
}: Readonly<TaskViewPageProps<TItem>>) {
	const { homePath } = useHostApp()

	if (!ownerList.data)
		return ownerList.isError ? (
			<main className={MAIN_CLASS}>
				<TaskListError onRetry={() => void ownerList.refetch()} />
			</main>
		) : (
			<TaskListSkeleton />
		)

	if (!item)
		return (
			<main className={MAIN_CLASS}>
				<header className="flex flex-col pt-1 md:pt-4">
					<h1 className="text-xl font-bold">{notFoundTitle}</h1>

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

	return <OpenEditorProvider key={item.id}>{children(item)}</OpenEditorProvider>
}
