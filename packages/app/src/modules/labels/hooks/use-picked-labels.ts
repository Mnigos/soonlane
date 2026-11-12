import type { Label } from '@soonlane/contracts'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { orpcQuery } from '../../../rpc-query.client'

const NO_LABELS: Label[] = []

export function usePickedLabels(defaultLabels = NO_LABELS) {
	const [labels, setLabels] = useState(defaultLabels)
	const { data } = useQuery(orpcQuery.labels.list.queryOptions())
	const pickedLabels = data
		? labels.flatMap(
				({ id }) => data.labels.find(label => label.id === id) ?? []
			)
		: labels

	return {
		pickedLabels,
		setLabels,
		resetLabels: () => setLabels(defaultLabels),
	}
}
