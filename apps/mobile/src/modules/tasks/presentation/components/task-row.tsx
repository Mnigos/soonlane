import {
	getMenuDateShortcuts,
	getNoDateHint,
} from '@soonlane/app/tasks/helpers/task-edit.helper'
import { useTaskMenuEdits } from '@soonlane/app/tasks/hooks/use-task-menu-edits'
import { ProjectViewContext } from '@soonlane/app/tasks/project-view'
import type { Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	DEFAULT_TASK_PRIORITY,
	getDueChipLabel,
	getDueLabel,
} from '@soonlane/domain'
import { useRouter } from 'expo-router'
import { use } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import { showDueDateSheet } from '../due-date-sheet.helper'
import {
	DUE_TONE_COLORS,
	LABEL_COLORS,
	PRIORITY_COLORS,
} from '../task-colors.constants'
import { CIRCLE_HIT_SLOP, TASK_ROW_STYLES } from '../task-row.constants'
import { GoalProgress } from './goal-progress'

interface TaskRowProps {
	task: Task
	today: CalendarDate
	onComplete: (task: Task) => void
	/** Names the due day in the due line, for a list without day headings. */
	showsDueDay?: boolean
}

/** 15% in hex alpha, the web's `bg-priority-N/15`. */
const PRIORITY_TINT_ALPHA = '26'
const MORE_DOTS = [0, 1, 2]

/** DESIGN.md's task row: the priority circle completes, a tap opens the task's details, the "…" or a long press its dates; the project's own view leaves its name out. */
export function TaskRow({
	task,
	today,
	onComplete,
	showsDueDay,
}: Readonly<TaskRowProps>) {
	const router = useRouter()
	const { changeDate } = useTaskMenuEdits(task, today)
	const due =
		task.dueDate &&
		(showsDueDay
			? getDueChipLabel(task.dueDate, { dueTime: task.dueTime }, today)
			: getDueLabel(task.dueDate, { dueTime: task.dueTime }, today))
	const project =
		task.project?.id === use(ProjectViewContext) ? undefined : task.project
	const priorityColor = PRIORITY_COLORS[task.priority]
	const hasMeta = due || task.labels.length > 0 || project

	function openDateMenu() {
		showDueDateSheet({
			shortcuts: getMenuDateShortcuts(today),
			hasNoDate: task.dueDate !== undefined,
			noDateHint: getNoDateHint(task.dueTime, task.repeat !== undefined),
			onChange: changeDate,
		})
	}

	return (
		<View style={TASK_ROW_STYLES.row}>
			<Pressable
				accessibilityLabel={`Complete ${task.title}`}
				accessibilityRole="button"
				hitSlop={CIRCLE_HIT_SLOP}
				onPress={() => onComplete(task)}
				style={({ pressed }) => [
					TASK_ROW_STYLES.circle,
					{ borderColor: priorityColor },
					(task.priority !== DEFAULT_TASK_PRIORITY || pressed) && {
						backgroundColor: `${priorityColor}${PRIORITY_TINT_ALPHA}`,
					},
				]}
			/>

			<Pressable
				accessibilityRole="button"
				onLongPress={openDateMenu}
				onPress={() =>
					router.push({ pathname: '/tasks/[id]', params: { id: task.id } })
				}
				style={styles.body}
			>
				<Text style={styles.title}>{task.title}</Text>

				{task.description && (
					<Text numberOfLines={1} style={styles.description}>
						{task.description}
					</Text>
				)}

				{task.goal && <GoalProgress goal={task.goal} />}

				{hasMeta && (
					<View style={styles.meta}>
						{due && (
							<Text
								style={[styles.caption, { color: DUE_TONE_COLORS[due.tone] }]}
							>
								{due.text}
							</Text>
						)}

						{task.labels.map(label => (
							<Text
								key={label.id}
								style={[
									styles.caption,
									{ color: LABEL_COLORS[label.color ?? 'charcoal'] },
								]}
							>
								{label.name}
							</Text>
						))}

						{project && <Text style={styles.caption}># {project.name}</Text>}
					</View>
				)}
			</Pressable>

			<Pressable
				accessibilityLabel="More task actions"
				accessibilityRole="button"
				hitSlop={6}
				onPress={openDateMenu}
				style={({ pressed }) => [styles.more, pressed && styles.pressed]}
			>
				{MORE_DOTS.map(dot => (
					<View key={dot} style={styles.dot} />
				))}
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	body: { flex: 1, gap: 2 },
	title: { ...TEXT.sm, color: COLORS.foreground },
	description: { ...TEXT.label, color: COLORS.mutedForeground },
	meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 },
	caption: { ...TEXT.caption, color: COLORS.mutedForeground },
	more: {
		width: 32,
		height: 32,
		marginVertical: -6,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 3,
		borderRadius: RADIUS.md,
	},
	pressed: { backgroundColor: COLORS.hover },
	dot: {
		width: 3,
		height: 3,
		borderRadius: 1.5,
		backgroundColor: COLORS.secondaryForeground,
	},
})
