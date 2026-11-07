import type { Label } from '@soonlane/contracts'
import { useQuery } from '@tanstack/react-query'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'

export function usePickedLabels(labels: Label[]) {
	const { data } = useQuery(orpcQuery.labels.list.queryOptions())

	if (!data) return labels

	return labels.flatMap(
		({ id }) => data.labels.find(label => label.id === id) ?? []
	)
}
