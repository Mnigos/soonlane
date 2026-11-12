import {
	type CalendarDate,
	TASK_SEARCH_QUERY_MAX_LENGTH,
} from '@soonlane/domain'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useDebouncedValue } from '../../hooks/use-debounced-value'
import { OpenEditorProvider } from '../open-editor-provider'
import { SearchResults } from './search-results'

interface SearchPageProps {
	today: CalendarDate
}

const SEARCH_DELAY_MS = 300

export function SearchPage({ today }: Readonly<SearchPageProps>) {
	const [query, setQuery] = useState('')
	const settledQuery = useDebouncedValue(query.trim(), SEARCH_DELAY_MS)

	return (
		<OpenEditorProvider>
			<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
				<header className="flex flex-col gap-3 pt-1 md:pt-4">
					<h1 className="text-xl font-bold">Search</h1>

					<div className="flex h-8 items-center gap-2 rounded-md border border-border-strong bg-background px-2">
						<Search
							aria-hidden
							className="size-4 shrink-0 text-muted-foreground"
						/>

						{/* Uncontrolled, so the query never reaches the value attribute. */}
						<input
							aria-label="Search tasks"
							autoFocus
							className="min-w-0 flex-1 bg-transparent text-sm outline-none"
							maxLength={TASK_SEARCH_QUERY_MAX_LENGTH}
							onChange={event => setQuery(event.target.value)}
							placeholder="Search tasks"
							type="search"
						/>
					</div>
				</header>

				{query.trim() !== '' && settledQuery !== '' && (
					<SearchResults query={settledQuery} today={today} />
				)}
			</main>
		</OpenEditorProvider>
	)
}
