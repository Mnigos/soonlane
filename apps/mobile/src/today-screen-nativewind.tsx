import { formatDayMonth, formatWeekday } from '@soonlane/domain'
import { ActivityIndicator, FlatList, Text, View } from 'react-native'
import { type TodayRow, useTodayRows } from './use-today-rows'

/** Literal class names, so Tailwind's scanner sees every one. */
const PRIORITY_BORDER = {
	1: 'border-priority-1',
	2: 'border-priority-2',
	3: 'border-priority-3',
	4: 'border-priority-4',
} as const

function TaskRow({ task, overdue }: Readonly<TodayRow>) {
	return (
		<View className="flex-row gap-3 border-b border-border py-3">
			<View
				className={`mt-px size-[18px] rounded-full border-[1.5px] ${PRIORITY_BORDER[task.priority]}`}
			/>

			<View className="flex-1 gap-1">
				<Text className="text-[15px] text-foreground">{task.title}</Text>

				<Text
					className={`text-caption leading-[16px] ${overdue ? 'text-danger' : 'text-due-today'}`}
				>
					{overdue ? task.dueDate : 'Today'}

					{task.dueTime ? ` ${task.dueTime}` : ''}
				</Text>
			</View>
		</View>
	)
}

/** Today styled with NativeWind classes read from the shared `@soonlane/tailwind-config/tokens`. */
export function TodayScreenNativewind() {
	const { today, rows, zodParsed, query } = useTodayRows()

	return (
		<View className="flex-1 bg-background px-5 pt-[72px]">
			<Text className="text-2xl font-bold text-foreground">Today</Text>

			<Text className="mt-0.5 mb-4 text-label text-muted-foreground">
				{formatWeekday(today, 'long')}, {formatDayMonth(today)}
			</Text>

			{zodParsed !== undefined && (
				<Text className="mb-2 text-micro leading-[16px] text-faint-foreground">
					NativeWind · Zod {zodParsed ? 'parsed' : 'rejected'} {rows.length}{' '}
					tasks on Hermes
				</Text>
			)}

			{query.isPending && <ActivityIndicator />}

			{query.isError && (
				<Text className="text-danger">{String(query.error)}</Text>
			)}

			<FlatList
				data={rows}
				keyExtractor={row => row.task.id}
				renderItem={({ item }) => <TaskRow {...item} />}
			/>
		</View>
	)
}
