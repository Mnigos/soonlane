import { Link } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'

interface BrowseItem {
	id: string
	name: string
	openTaskCount: number
}

interface BrowseListProps<TItem extends BrowseItem> {
	heading: string
	emptyNote: string
	loadError: string
	/** Undefined until the list loads. */
	items: TItem[] | undefined
	isError: boolean
	pathname: '/labels/[name]' | '/projects/[name]'
	renderIcon: (item: TItem) => ReactNode
}

/** The web sidebar's list of labels or projects: each row opens its view and shows its open task count. */
export function BrowseList<TItem extends BrowseItem>({
	heading,
	emptyNote,
	loadError,
	items,
	isError,
	pathname,
	renderIcon,
}: Readonly<BrowseListProps<TItem>>) {
	return (
		<View style={styles.section}>
			<Text accessibilityRole="header" style={styles.heading}>
				{heading}
			</Text>

			{items?.length === 0 && <Text style={styles.note}>{emptyNote}</Text>}

			{isError && <Text style={styles.note}>{loadError}</Text>}

			{items?.map(item => (
				<Link
					asChild
					href={{ pathname, params: { name: item.name } }}
					key={item.id}
				>
					<Pressable
						accessibilityLabel={
							item.openTaskCount > 0
								? `${item.name} ${item.openTaskCount}`
								: item.name
						}
						style={({ pressed }) => [styles.row, pressed && styles.pressed]}
					>
						{renderIcon(item)}

						<Text numberOfLines={1} style={styles.name}>
							{item.name}
						</Text>

						{item.openTaskCount > 0 && (
							<Text style={styles.count}>{item.openTaskCount}</Text>
						)}
					</Pressable>
				</Link>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	section: { gap: 2, marginTop: 24 },
	heading: {
		...TEXT.sm,
		paddingBottom: 6,
		fontWeight: '600',
		color: COLORS.foreground,
	},
	note: { ...TEXT.label, paddingVertical: 6, color: COLORS.faintForeground },
	row: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingHorizontal: 8,
		borderRadius: RADIUS.md,
	},
	pressed: { backgroundColor: COLORS.hover },
	name: { ...TEXT.sm, flex: 1, color: COLORS.foreground },
	count: { ...TEXT.caption, color: COLORS.mutedForeground },
})
