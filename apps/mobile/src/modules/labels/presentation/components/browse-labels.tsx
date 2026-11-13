import { orpcQuery } from '@soonlane/app/rpc-query'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, View } from 'react-native'
import { BrowseList } from '@/modules/shell/presentation/components/browse-list'
import { LABEL_COLORS } from '@/modules/tasks/presentation/task-colors.constants'

export function BrowseLabels() {
	const { data, isError } = useQuery(orpcQuery.labels.list.queryOptions())

	return (
		<BrowseList
			emptyNote="No labels yet"
			heading="Labels"
			isError={isError}
			items={data?.labels}
			loadError="Could not load your labels."
			pathname="/labels/[name]"
			renderIcon={label => (
				<View
					style={[
						styles.dot,
						{ backgroundColor: LABEL_COLORS[label.color ?? 'charcoal'] },
					]}
				/>
			)}
		/>
	)
}

const styles = StyleSheet.create({
	dot: { width: 10, height: 10, marginHorizontal: 3, borderRadius: 5 },
})
