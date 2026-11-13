import { orpcQuery } from '@soonlane/app/rpc-query'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, Text } from 'react-native'
import { BrowseList } from '@/modules/shell/presentation/components/browse-list'
import { COLORS, TEXT } from '@/tokens.gen'

export function BrowseProjects() {
	const { data, isError } = useQuery(orpcQuery.projects.list.queryOptions())

	return (
		<BrowseList
			emptyNote="No projects yet"
			heading="Projects"
			isError={isError}
			items={data?.projects}
			loadError="Could not load your projects."
			pathname="/projects/[name]"
			renderIcon={() => <Text style={styles.hash}>#</Text>}
		/>
	)
}

const styles = StyleSheet.create({
	hash: {
		...TEXT.sm,
		width: 16,
		textAlign: 'center',
		color: COLORS.mutedForeground,
	},
})
