import type { CalendarDate } from '@soonlane/domain'
import type { ReactNode } from 'react'
import { PlaceholderScreen } from '@/modules/shell/presentation/components/placeholder-screen'
import { TextLink } from '@/modules/shell/presentation/components/text-link'
import { TaskSectionList } from './task-section-list'

interface TaskViewScreenProps<TItem> {
	/** The name in the route, the title until the owner list loads. */
	name: string
	today: CalendarDate
	/** The query of the list the view's label or project is found in. */
	ownerList: { data: unknown; isError: boolean }
	item: TItem | undefined
	notFoundTitle: string
	children: (item: TItem) => ReactNode
}

/** Waits for the owner list, then shows the view of the item found in it or the web's not-found page. */
export function TaskViewScreen<TItem>({
	name,
	today,
	ownerList,
	item,
	notFoundTitle,
	children,
}: Readonly<TaskViewScreenProps<TItem>>) {
	if (!ownerList.data)
		return (
			<TaskSectionList
				footer={{ isLoading: !ownerList.isError }}
				isError={ownerList.isError}
				sections={[]}
				title={name}
				today={today}
			/>
		)

	if (!item)
		return (
			<PlaceholderScreen
				description="It may have been renamed or deleted."
				title={notFoundTitle}
			>
				<TextLink href="/upcoming">Back to Upcoming</TextLink>
			</PlaceholderScreen>
		)

	return <>{children(item)}</>
}
