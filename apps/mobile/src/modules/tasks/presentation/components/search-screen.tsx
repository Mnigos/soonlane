import { SEARCH_DELAY_MS } from '@soonlane/app/tasks/helpers/task-search.constants'
import { useDebouncedValue } from '@soonlane/app/tasks/hooks/use-debounced-value'
import { useSearchTasksQuery } from '@soonlane/app/tasks/hooks/use-search-tasks-query'
import {
	type CalendarDate,
	TASK_SEARCH_QUERY_MAX_LENGTH,
} from '@soonlane/domain'
import { useState } from 'react'
import { TextInput } from 'react-native'
import { SEARCH_FIELD_STYLES } from '@/modules/shell/presentation/search-field.constants'
import { COLORS } from '@/tokens.gen'
import { type TaskSection, TaskSectionList } from './task-section-list'

interface SearchScreenProps {
	today: CalendarDate
}

/** The web's Search page: open matches with their due day, then the completed ones, which reopen. */
export function SearchScreen({ today }: Readonly<SearchScreenProps>) {
	const [query, setQuery] = useState('')
	const settledQuery = useDebouncedValue(query.trim(), SEARCH_DELAY_MS)
	const { data, isPending, isError } = useSearchTasksQuery(settledQuery)
	// The web unmounts its results once the field is cleared; here they stay mounted and are hidden.
	const isSearching = query.trim() !== '' && settledQuery !== ''
	const results = isSearching ? data : undefined
	const tasks = results?.tasks ?? []
	const completed = tasks.filter(task => task.completedAt)
	const sections: TaskSection[] = [
		{ key: 'open', data: tasks.filter(task => !task.completedAt) },
		...(completed.length > 0
			? [
					{
						key: 'completed',
						heading: 'Completed',
						isCompleted: true,
						data: completed,
					},
				]
			: []),
	]

	return (
		<TaskSectionList
			footer={
				isSearching
					? {
							isLoading: isPending,
							note:
								results && tasks.length === 0
									? 'No tasks match.'
									: results?.hasMore
										? 'Showing the first 50 tasks. Add a word to narrow the results.'
										: undefined,
						}
					: undefined
			}
			header={
				<TextInput
					accessibilityLabel="Search tasks"
					autoCapitalize="none"
					autoCorrect={false}
					autoFocus
					clearButtonMode="while-editing"
					keyboardAppearance="dark"
					maxLength={TASK_SEARCH_QUERY_MAX_LENGTH}
					onChangeText={setQuery}
					placeholder="Search tasks"
					placeholderTextColor={COLORS.faintForeground}
					returnKeyType="search"
					selectionColor={COLORS.primary}
					style={[SEARCH_FIELD_STYLES.field, SEARCH_FIELD_STYLES.text]}
					value={query}
				/>
			}
			isError={isSearching && isError}
			sections={sections}
			showsDueDay
			title="Search"
			today={today}
		/>
	)
}
