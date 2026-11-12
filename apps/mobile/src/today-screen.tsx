import { useTasksQuery } from '@soonlane/app/tasks/hooks/use-tasks-query'
import type { Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	formatDayMonth,
	formatWeekday,
	getToday,
} from '@soonlane/domain'
import { useState } from 'react'
import {
	ActivityIndicator,
	FlatList,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { COLORS } from './theme.constants'

interface Row {
	task: Task
	overdue: boolean
}

function TaskRow({ task, overdue }: Readonly<Row>) {
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

/** Today: overdue tasks, then the ones due today, from the shared `tasks.list` query. */
export function TodayScreen() {
	// Spike: read once; the real app re-reads at midnight and on foreground.
	// oxlint-disable-next-line react/hook-use-state
	const [today] = useState<CalendarDate>(() => getToday(new Date()))
	const { data, isPending, isError, error } = useTasksQuery({
		today,
		from: today,
		to: today,
	})
	const rows: Row[] = [
		...(data?.overdue ?? []).map(task => ({ task, overdue: true })),
		...(data?.scheduled ?? []).map(task => ({ task, overdue: false })),
	]

	return (
		<View style={styles.screen}>
			<Text style={styles.heading}>Today</Text>

			<Text style={styles.subheading}>
				{formatWeekday(today, 'long')}, {formatDayMonth(today)}
			</Text>

			{isPending && <ActivityIndicator color={COLORS.primary} />}

			{isError && <Text style={styles.overdue}>{String(error)}</Text>}

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
