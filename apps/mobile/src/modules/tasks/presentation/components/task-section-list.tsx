import { getHostPorts } from '@soonlane/app/host-ports'
import { refreshTaskLists } from '@soonlane/app/tasks/helpers/task-list.helper'
import { useCompleteTask } from '@soonlane/app/tasks/hooks/use-complete-task'
import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
	Pressable,
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OutlineButton } from '@/modules/shell/presentation/components/outline-button'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import { TaskComposer } from './task-composer'
import { TaskRow } from './task-row'

/** One heading and its tasks, in the order and grouping of the web list. */
export interface TaskSection {
	key: string
	heading: string
	/** Days after today, whose heading is pencil grey as on the web. */
	isMuted: boolean
	isLoading: boolean
	/** Shown once loaded without tasks, like Overdue's "Nothing overdue." */
	emptyText?: string
	/** Adds the web's "+ Add task" row, whose composer starts due this day. */
	addDate?: CalendarDate
	data: Task[]
}

interface TaskSectionListProps {
	title: string
	subtitle?: string
	today: CalendarDate
	sections: TaskSection[]
	isError: boolean
	onEndReached?: () => void
}

/** A task list screen: pull to refresh, the web's load error with Try again, and sticky section headings. */
export function TaskSectionList({
	title,
	subtitle,
	today,
	sections,
	isError,
	onEndReached,
}: Readonly<TaskSectionListProps>) {
	const queryClient = useQueryClient()
	const { completeTask } = useCompleteTask(today)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [composerDate, setComposerDate] = useState<CalendarDate>()

	async function refresh() {
		setIsRefreshing(true)
		await refreshTaskLists(queryClient)
		setIsRefreshing(false)
	}

	function openComposer(date: CalendarDate) {
		getHostPorts().capture('composer_opened', { source: 'day_row' })
		setComposerDate(date)
	}

	function cancelComposer() {
		getHostPorts().capture('composer_cancelled', { source: 'day_row' })
		setComposerDate(undefined)
	}

	return (
		<SafeAreaView edges={['top']} style={styles.screen}>
			<SectionList
				contentContainerStyle={styles.content}
				contentInsetAdjustmentBehavior="automatic"
				keyExtractor={task => task.id}
				ListHeaderComponent={
					<View style={styles.header}>
						<Text accessibilityRole="header" style={styles.title}>
							{title}
						</Text>

						{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

						{isError && (
							<View accessibilityRole="alert" style={styles.error}>
								<Text style={styles.errorText}>Could not load your tasks.</Text>

								<OutlineButton onPress={() => void refresh()}>
									Try again
								</OutlineButton>
							</View>
						)}
					</View>
				}
				onEndReached={onEndReached}
				refreshControl={
					<RefreshControl
						onRefresh={() => void refresh()}
						refreshing={isRefreshing}
						tintColor={COLORS.mutedForeground}
					/>
				}
				renderItem={({ item }) => (
					<TaskRow onComplete={completeTask} task={item} today={today} />
				)}
				renderSectionFooter={({ section }) => {
					if (section.isLoading)
						return (
							<View accessibilityState={{ busy: true }} style={styles.loading}>
								<View style={styles.skeleton} />
							</View>
						)
					const { addDate } = section

					return (
						<>
							{section.emptyText && section.data.length === 0 && (
								<Text style={styles.empty}>{section.emptyText}</Text>
							)}

							{addDate && (
								<Pressable
									accessibilityRole="button"
									onPress={() => openComposer(addDate)}
									style={({ pressed }) => [
										styles.addTask,
										pressed && styles.pressed,
									]}
								>
									<Text style={styles.plus}>+</Text>

									<Text style={styles.addTaskLabel}>Add task</Text>
								</Pressable>
							)}
						</>
					)
				}}
				renderSectionHeader={({ section }) => (
					<Text
						accessibilityRole="header"
						style={[styles.heading, section.isMuted && styles.mutedHeading]}
					>
						{section.heading}
					</Text>
				)}
				sections={sections}
			/>

			{composerDate && (
				<TaskComposer
					defaultDueDate={composerDate}
					onClose={cancelComposer}
					today={today}
				/>
			)}
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: COLORS.background },
	content: { paddingHorizontal: 16, paddingBottom: 24 },
	header: { gap: 4, paddingTop: 16 },
	title: { ...TEXT.xl, fontWeight: '700', color: COLORS.foreground },
	subtitle: { ...TEXT.label, color: COLORS.mutedForeground },
	error: { gap: 8, marginTop: 16 },
	errorText: { ...TEXT.sm, color: COLORS.danger },
	heading: {
		...TEXT.sm,
		paddingTop: 24,
		paddingBottom: 8,
		fontWeight: '600',
		color: COLORS.foreground,
		backgroundColor: COLORS.background,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	mutedHeading: { color: COLORS.mutedForeground },
	loading: {
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	skeleton: {
		width: '40%',
		height: 16,
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.hover,
	},
	empty: { ...TEXT.sm, paddingVertical: 12, color: COLORS.faintForeground },
	addTask: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	pressed: { backgroundColor: COLORS.hover },
	plus: { ...TEXT.lg, width: 18, textAlign: 'center', color: COLORS.primary },
	addTaskLabel: { ...TEXT.sm, color: COLORS.mutedForeground },
})
