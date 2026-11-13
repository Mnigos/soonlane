import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { getHostPorts } from '../../../host-ports.client'
import { orpcQuery } from '../../../rpc-query.client'

/** Keeps the last results on screen while the next query loads; `tasks_searched` fires once per new query, not on the refetches after a change. */
export function useSearchTasksQuery(query: string) {
	const { capture } = getHostPorts()
	const capturedQuery = useRef<string>(undefined)
	const options = orpcQuery.tasks.search.queryOptions({
		input: { query },
		enabled: query !== '',
		placeholderData: keepPreviousData,
		// Every return to a query fetches, so each search is counted once.
		staleTime: 0,
	})

	return useQuery({
		...options,
		queryFn: async context => {
			const result = await options.queryFn(context)

			if (capturedQuery.current !== query) {
				capturedQuery.current = query
				capture('tasks_searched', { resultCount: result.tasks.length })
			}

			return result
		},
	})
}
