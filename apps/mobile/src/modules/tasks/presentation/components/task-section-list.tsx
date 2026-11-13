import { getHostPorts } from '@soonlane/app/host-ports'
import { refreshTaskLists } from '@soonlane/app/tasks/helpers/task-list.helper'
import { useCompleteTask } from '@soonlane/app/tasks/hooks/use-complete-task'
import { useReopenTask } from '@soonlane/app/tasks/hooks/use-reopen-task'
import type { Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useQueryClient } from '@tanstack/react-query'
import { type ComponentProps, type ReactNode, useState } from 'react'
import {
	RefreshControl,
	SectionList,
	StyleSheet,
	Text,
	View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OutlineButton } from '@/modules/shell/presentation/components/outline-button'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import { AddTaskRow } from './add-task-row'
import { CompletedTaskRow } from './completed-task-row'
import { TaskComposer } from './task-composer'
import { TaskRow } from './task-row'

/** One heading and its tasks, in the order and grouping of the web list. */
export interface TaskSection {
	key: string
	/** Left out for a list without headings, like Search's open tasks. */
	heading?: string
	count?: number
	/** Days after today, whose heading is pencil grey as on the web. */
	isMuted?: boolean
	isLoading?: boolean
	isCompleted?: boolean
	/** Shown once loaded without tasks, like Overdue's "Nothing overdue." */
	emptyText?: string
	/** Adds the web's "+ Add task" row, whose composer starts due this day. */
	addDate?: CalendarDate
	data: Task[]
}

/** What follows every section in a label, project or search view: its loading row or note, then its one "+ Add task" row. */
interface TaskListFooter {
	isLoading: boolean
	note?: string
	addDate?: CalendarDate
}

export type ComposerPreset = Pick<
	ComponentProps<typeof TaskComposer>,
	'defaultLabels' | 'defaultProject' | 'source'
>

interface TaskSectionListProps {
	title: string
	subtitle?: string
	header?: ReactNode
	today: CalendarDate
	sections: TaskSection[]
	isError: boolean
	footer?: TaskListFooter
	composer?: ComposerPreset
	showsDueDay?: boolean
	onEndReached?: () => void
}

const DAY_ROW_COMPOSER: ComposerPreset = { source: 'day_row' }

function LoadingRow() {
	return (
		<View accessibilityState={{ busy: true }} style={styles.loading}>
			<View style={styles.skeleton} />
		</View>
	)
}

/** A task list screen: pull to refresh, the web's load error with Try again, and sticky section headings. */
export function TaskSectionList({
	title,
	subtitle,
	header,
	today,
	sections,
	isError,
	footer,
	composer = DAY_ROW_COMPOSER,
	showsDueDay,
	onEndReached,
}: Readonly<TaskSectionListProps>) {
	const queryClient = useQueryClient()
	const { capture } = getHostPorts()
	const { completeTask } = useCompleteTask(today)
	const { reopenTask, isCompleting } = useReopenTask(today)
	const [isRefreshing, setIsRefreshing] = useState(false)
	const [composerDate, setComposerDate] = useState<CalendarDate>()
	// The web counts opening and cancelling only for a day's composer.
	const isDayRow = composer.source === 'day_row'
	const footerAddDate = footer?.addDate

	async function refresh() {
		setIsRefreshing(true)
		await refreshTaskLists(queryClient)
		setIsRefreshing(false)
	}

	function openComposer(date: CalendarDate) {
		if (isDayRow) capture('composer_opened', { source: composer.source })
		setComposerDate(date)
	}

	function cancelComposer() {
		if (isDayRow) capture('composer_cancelled', { source: composer.source })
		setComposerDate(undefined)
	}

	return (
		<SafeAreaView edges={['top']} style={styles.screen}>
			<SectionList
				contentContainerStyle={styles.content}
				contentInsetAdjustmentBehavior="automatic"
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="handled"
				keyExtractor={task => task.id}
				ListFooterComponent={
					footer && (
						<View style={styles.footer}>
							{footer.isLoading ? (
								<LoadingRow />
							) : (
								footer.note && <Text style={styles.note}>{footer.note}</Text>
							)}

							{footerAddDate && (
								<AddTaskRow onPress={() => openComposer(footerAddDate)} />
							)}
						</View>
					)
				}
				ListHeaderComponent={
					<View style={styles.header}>
						<Text accessibilityRole="header" style={styles.title}>
							{title}
						</Text>

						{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

						{header}

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
				renderItem={({ item, section }) =>
					section.isCompleted ? (
						<CompletedTaskRow
							isDisabled={isCompleting}
							onReopen={reopenTask}
							task={item}
						/>
					) : (
						<TaskRow
							onComplete={completeTask}
							showsDueDay={showsDueDay}
							task={item}
							today={today}
						/>
					)
				}
				renderSectionFooter={({ section }) => {
					if (section.isLoading) return <LoadingRow />
					const { addDate } = section

					return (
						<>
							{section.emptyText && section.data.length === 0 && (
								<Text style={styles.empty}>{section.emptyText}</Text>
							)}

							{addDate && <AddTaskRow onPress={() => openComposer(addDate)} />}
						</>
					)
				}}
				renderSectionHeader={({ section }) =>
					section.heading === undefined ? null : (
						<Text
							accessibilityRole="header"
							style={[styles.heading, section.isMuted && styles.mutedHeading]}
						>
							{section.heading}

							{section.count !== undefined && (
								<Text style={styles.count}> {section.count}</Text>
							)}
						</Text>
					)
				}
				sections={sections}
			/>

			{composerDate && (
				<TaskComposer
					{...composer}
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
	count: { fontWeight: '400', color: COLORS.mutedForeground },
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
	footer: { paddingTop: 16 },
	note: { ...TEXT.label, paddingBottom: 8, color: COLORS.faintForeground },
})
