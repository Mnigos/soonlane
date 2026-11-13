import { formatDayMonth, formatWeekday } from '@soonlane/domain'
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { COLORS } from './theme.constants'
import { type TodayRow, useTodayRows } from './use-today-rows'

function TaskRow({ task, overdue }: Readonly<TodayRow>) {
	return (
		<View style={styles.row}>
			<View
				style={[styles.circle, { borderColor: COLORS.priority[task.priority] }]}
			/>

			<View style={styles.rowText}>
				<Text style={styles.title}>{task.title}</Text>

				<Text style={[styles.due, overdue && styles.overdue]}>
					{overdue ? task.dueDate : 'Today'}

					{task.dueTime ? ` ${task.dueTime}` : ''}
				</Text>
			</View>
		</View>
	)
}

/** Today styled with plain StyleSheet and token values copied into `theme.constants.ts`. */
export function TodayScreen() {
	const { today, rows, zodParsed, query } = useTodayRows()

	return (
		<View style={styles.screen}>
			<Text style={styles.heading}>Today</Text>

			<Text style={styles.subheading}>
				{formatWeekday(today, 'long')}, {formatDayMonth(today)}
			</Text>

			{zodParsed !== undefined && (
				<Text style={styles.check}>
					StyleSheet · Zod {zodParsed ? 'parsed' : 'rejected'} {rows.length}{' '}
					tasks on Hermes
				</Text>
			)}

			{query.isPending && <ActivityIndicator color={COLORS.primary} />}

			{query.isError && (
				<Text style={styles.overdue}>{String(query.error)}</Text>
			)}

			<FlatList
				data={rows}
				keyExtractor={row => row.task.id}
				renderItem={({ item }) => <TaskRow {...item} />}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: COLORS.background,
		paddingHorizontal: 20,
		paddingTop: 72,
	},
	heading: { color: COLORS.foreground, fontSize: 24, fontWeight: '700' },
	subheading: {
		color: COLORS.mutedForeground,
		fontSize: 13,
		marginBottom: 16,
		marginTop: 2,
	},
	check: { color: COLORS.faintForeground, fontSize: 11, marginBottom: 8 },
	row: {
		flexDirection: 'row',
		gap: 12,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	circle: {
		width: 18,
		height: 18,
		borderRadius: 9,
		borderWidth: 1.5,
		marginTop: 1,
	},
	rowText: { flex: 1, gap: 4 },
	title: { color: COLORS.foreground, fontSize: 15 },
	due: { color: COLORS.dueToday, fontSize: 12 },
	overdue: { color: COLORS.danger },
})
