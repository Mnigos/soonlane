import { Link } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BrowseLabels } from '@/modules/labels/presentation/components/browse-labels'
import { BrowseProjects } from '@/modules/projects/presentation/components/browse-projects'
import { COLORS, TEXT } from '@/tokens.gen'
import { SEARCH_FIELD_STYLES } from '../search-field.constants'
import { TextLink } from './text-link'

/** The web sidebar's lists on a tab: a search field that opens Search, Projects, Labels, and Settings. */
export function BrowseScreen() {
	return (
		<SafeAreaView edges={['top']} style={styles.screen}>
			<ScrollView
				contentContainerStyle={styles.content}
				contentInsetAdjustmentBehavior="automatic"
			>
				<Text accessibilityRole="header" style={styles.title}>
					Browse
				</Text>

				<Link asChild href="/search">
					<Pressable
						accessibilityLabel="Search tasks"
						style={[SEARCH_FIELD_STYLES.field, styles.search]}
					>
						<Text style={[SEARCH_FIELD_STYLES.text, styles.placeholder]}>
							Search tasks
						</Text>
					</Pressable>
				</Link>

				<BrowseProjects />

				<BrowseLabels />

				<TextLink href="/settings">Settings</TextLink>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: COLORS.background },
	content: { padding: 16 },
	title: { ...TEXT.xl, fontWeight: '700', color: COLORS.foreground },
	search: { marginTop: 12 },
	placeholder: { color: COLORS.faintForeground },
})
