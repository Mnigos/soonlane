import type { Task } from '@soonlane/contracts'
import { TASK_SEARCH_QUERY_MAX_LENGTH } from '@soonlane/domain'
import { cn } from '@soonlane/ui/cn'
import {
	Combobox,
	ComboboxCollection,
	ComboboxGroup,
	ComboboxGroupLabel,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from '@soonlane/ui/components/combobox'
import { Dialog } from '@soonlane/ui/components/dialog'
import { useQuery } from '@tanstack/react-query'
import { type HistoryState, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { APP_PATHS } from '../../../app-path.constants'
import { orpcQuery } from '../../../rpc-query.client'
import {
	LABEL_ROW_CLASS,
	PICKER_FIELD_CLASS,
	PICKER_FIELD_ROW_CLASS,
	PICKER_NOTE_CLASS,
} from '../../tasks/helpers/composer-chip.constants'
import { SEARCH_DELAY_MS } from '../../tasks/helpers/task-search.constants'
import { filterByName } from '../../tasks/helpers/task-view.helper'
import { useDebouncedValue } from '../../tasks/hooks/use-debounced-value'
import { useSearchTasksQuery } from '../../tasks/hooks/use-search-tasks-query'
import { useToday } from '../../tasks/hooks/use-today'
import { rememberRecentView } from '../helpers/recent-views.helper'
import { useRecentItems } from '../hooks/use-recent-items'
import { VIEW_SHORTCUTS } from '../keyboard-shortcuts.constants'
import type { PaletteGroup, PaletteItem } from '../search-palette.types'
import { SearchPaletteOption } from './search-palette-option'

interface SearchPaletteProps {
	onClose: () => void
	onEditTask: (task: Task) => void
}

/** Hands the query to the Search page in navigation state, never in the URL; a new id resets the page even for the same query. */
interface SearchHandoff extends HistoryState {
	searchQuery: string
	handoffId: string
}

const TASK_RESULT_LIMIT = 8
const GROUP_LABEL_CLASS =
	'px-3 pt-2 pb-1 text-label font-semibold text-muted-foreground'

function getItemKey(item: PaletteItem) {
	if (item.kind === 'view') return item.view.view
	if (item.kind === 'project') return item.project.id
	if (item.kind === 'label') return item.label.id
	if (item.kind === 'task') return item.task.id

	return item.kind
}

/** Todoist's search palette: recent views and navigation while empty, then matching views and open tasks. */
export function SearchPalette({
	onClose,
	onEditTask,
}: Readonly<SearchPaletteProps>) {
	const navigate = useNavigate()
	const today = useToday()
	const [query, setQuery] = useState('')
	const search = query.trim()
	const settledQuery = useDebouncedValue(search, SEARCH_DELAY_MS)
	const { data: labelData } = useQuery(orpcQuery.labels.list.queryOptions())
	const { data: projectData } = useQuery(orpcQuery.projects.list.queryOptions())
	const recent = useRecentItems(labelData?.labels, projectData?.projects)
	const { data, isPlaceholderData } = useSearchTasksQuery(settledQuery)
	const navigation: PaletteItem[] = [
		...filterByName(VIEW_SHORTCUTS, search).map(view => ({
			kind: 'view' as const,
			view,
		})),
		...filterByName(projectData?.projects ?? [], search).map(project => ({
			kind: 'project' as const,
			project,
		})),
		...filterByName(labelData?.labels ?? [], search).map(label => ({
			kind: 'label' as const,
			label,
		})),
	]
	const tasks =
		search === ''
			? []
			: (data?.tasks.filter(task => !task.completedAt) ?? []).slice(
					0,
					TASK_RESULT_LIMIT
				)
	const groups: PaletteGroup[] =
		search === ''
			? [
					{ heading: 'Recent', items: recent },
					{ heading: 'Navigation', items: navigation },
				]
			: [
					{ heading: 'Navigation', items: navigation },
					{
						heading: 'Tasks',
						items: tasks.map(task => ({ kind: 'task', task })),
					},
					{ items: [{ kind: 'all' }] },
				]

	function pick(item: PaletteItem) {
		const handoff: SearchHandoff = {
			searchQuery: search,
			handoffId: crypto.randomUUID(),
		}

		if (item.kind === 'task') {
			rememberRecentView({ kind: 'task', id: item.task.id })
			onEditTask(item.task)
			return
		}

		if (item.kind === 'view') void navigate({ to: APP_PATHS[item.view.view] })
		else if (item.kind === 'project')
			void navigate({
				to: APP_PATHS.project,
				params: { name: item.project.name },
			})
		else if (item.kind === 'label')
			void navigate({ to: APP_PATHS.label, params: { name: item.label.name } })
		else void navigate({ to: APP_PATHS.search, state: handoff })
		onClose()
	}

	return (
		<Dialog
			className="flex max-h-[min(36rem,76dvh)] flex-col overflow-hidden max-sm:inset-x-0 max-sm:top-0 max-sm:max-h-dvh max-sm:w-full max-sm:translate-none max-sm:rounded-none max-sm:border-x-0 max-sm:border-t-0 sm:top-[12dvh] sm:translate-y-0"
			label="Search"
			onClose={onClose}
		>
			<Combobox
				autoHighlight="always"
				filter={null}
				inline
				items={groups.filter(group => group.items.length > 0)}
				onInputValueChange={setQuery}
				onValueChange={(item: PaletteItem | null) => {
					if (item) pick(item)
				}}
				open
			>
				<div className={cn(PICKER_FIELD_ROW_CLASS, 'h-12 gap-2')}>
					<Search
						aria-hidden
						className="size-4 shrink-0 text-muted-foreground"
					/>

					<ComboboxInput
						aria-label="Search tasks and views"
						className={PICKER_FIELD_CLASS}
						maxLength={TASK_SEARCH_QUERY_MAX_LENGTH}
						placeholder="Search tasks and views"
						// Uncontrolled, so the query never reaches the value attribute.
						render={props => <input {...props} value={undefined} />}
					/>
				</div>

				{search !== '' &&
					search === settledQuery &&
					data &&
					!isPlaceholderData &&
					navigation.length === 0 &&
					tasks.length === 0 && (
						<p className={PICKER_NOTE_CLASS}>No matches.</p>
					)}

				<ComboboxList className="min-h-0 flex-1 overflow-y-auto py-1 empty:hidden">
					{(group: PaletteGroup) => (
						<ComboboxGroup items={group.items} key={group.heading ?? 'all'}>
							{group.heading && (
								<ComboboxGroupLabel className={GROUP_LABEL_CLASS}>
									{group.heading}
								</ComboboxGroupLabel>
							)}

							<ComboboxCollection>
								{(item: PaletteItem) => (
									<ComboboxItem
										className={cn(
											LABEL_ROW_CLASS,
											item.kind === 'task' && 'h-auto items-start py-1.5'
										)}
										key={getItemKey(item)}
										value={item}
									>
										{today && <SearchPaletteOption item={item} today={today} />}
									</ComboboxItem>
								)}
							</ComboboxCollection>
						</ComboboxGroup>
					)}
				</ComboboxList>
			</Combobox>
		</Dialog>
	)
}
