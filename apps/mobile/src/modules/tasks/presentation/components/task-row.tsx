import {
	getMenuDateShortcuts,
	getNoDateHint,
} from '@soonlane/app/tasks/helpers/task-edit.helper'
import { useTaskMenuEdits } from '@soonlane/app/tasks/hooks/use-task-menu-edits'
import type { Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	DEFAULT_TASK_PRIORITY,
	getDueLabel,
} from '@soonlane/domain'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import { showDueDateSheet } from '../due-date-sheet.helper'
import {
	DUE_TONE_COLORS,
	LABEL_COLORS,
	PRIORITY_COLORS,
} from '../task-colors.constants'

interface TaskRowProps {
	task: Task
	today: CalendarDate
	onComplete: (task: Task) => void
}

/** 15% in hex alpha, the web's `bg-priority-N/15`. */
const PRIORITY_TINT_ALPHA = '26'
/** Lets the 18px circle take a 44px touch. */
const CIRCLE_HIT_SLOP = 13
const MORE_DOTS = [0, 1, 2]

/** DESIGN.md's task row: the priority circle completes, the "…" or a long press opens the row menu's dates. */
export function TaskRow({ task, today, onComplete }: Readonly<TaskRowProps>) {
	const { changeDate } = useTaskMenuEdits(task, today)
	const due =
		task.dueDate && getDueLabel(task.dueDate, { dueTime: task.dueTime }, today)
	const priorityColor = PRIORITY_COLORS[task.priority]
	const hasMeta = due || task.labels.length > 0 || task.project

	function openDateMenu() {
		showDueDateSheet({
			shortcuts: getMenuDateShortcuts(today),
			hasNoDate: task.dueDate !== undefined,
			noDateHint: getNoDateHint(task.dueTime, task.repeat !== undefined),
			onChange: changeDate,
		})
	}

	return (
		<Pressable accessible={false} onLongPress={openDateMenu} style={styles.row}>
			<Pressable
				accessibilityLabel={`Complete ${task.title}`}
				accessibilityRole="button"
				hitSlop={CIRCLE_HIT_SLOP}
				onPress={() => onComplete(task)}
				style={({ pressed }) => [
					styles.circle,
					{ borderColor: priorityColor },
					(task.priority !== DEFAULT_TASK_PRIORITY || pressed) && {
						backgroundColor: `${priorityColor}${PRIORITY_TINT_ALPHA}`,
					},
				]}
			/>

			<View style={styles.body}>
				<Text style={styles.title}>{task.title}</Text>

				{task.description && (
					<Text numberOfLines={1} style={styles.description}>
						{task.description}
					</Text>
				)}

				{task.goal && (
					<View style={styles.goal}>
						<Text style={styles.caption}>
							{task.goal.progress}/{task.goal.target}
							{task.goal.unit && ` ${task.goal.unit}`}
						</Text>

						<View style={styles.goalTrack}>
							<View
								style={[
									styles.goalFill,
									{
										width: `${(task.goal.progress / task.goal.target) * 100}%`,
									},
								]}
							/>
						</View>
					</View>
				)}

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

						{task.project && (
							<Text style={styles.caption}># {task.project.name}</Text>
						)}
					</View>
				)}
			</View>

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
		</Pressable>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: 'row',
		gap: 10,
		paddingVertical: 10,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	circle: {
		width: 18,
		height: 18,
		marginTop: 1,
		borderWidth: 2,
		borderRadius: 9,
	},
	body: { flex: 1, gap: 2 },
	title: { ...TEXT.sm, color: COLORS.foreground },
	description: { ...TEXT.label, color: COLORS.mutedForeground },
	goal: { gap: 4 },
	goalTrack: {
		height: 2,
		maxWidth: 192,
		overflow: 'hidden',
		backgroundColor: COLORS.border,
	},
	goalFill: { height: 2, backgroundColor: COLORS.mutedForeground },
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
