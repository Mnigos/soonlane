import type { PropsWithChildren } from 'react'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS, TEXT } from '@/tokens.gen'

interface PlaceholderScreenProps extends PropsWithChildren {
	title: string
	description: string
}

/** Stands in for a screen until the ticket that builds it. */
export function PlaceholderScreen({
	title,
	description,
	children,
}: Readonly<PlaceholderScreenProps>) {
	return (
		<SafeAreaView edges={['top']} style={styles.screen}>
			<Text style={styles.title}>{title}</Text>

			<Text style={styles.description}>{description}</Text>

			{children}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		gap: 4,
		padding: 16,
		backgroundColor: COLORS.background,
	},
	title: { ...TEXT.xl, fontWeight: '700', color: COLORS.foreground },
	description: { ...TEXT.sm, color: COLORS.mutedForeground },
})
