import type { Task } from '@soonlane/contracts'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'
import { CIRCLE_HIT_SLOP, TASK_ROW_STYLES } from '../task-row.constants'

interface CompletedTaskRowProps {
	task: Task
	isDisabled: boolean
	onReopen: (task: Task) => void
}

/** The web's completed row: a filled grey circle with a check that reopens the task, and the title struck through. */
export function CompletedTaskRow({
	task,
	isDisabled,
	onReopen,
}: Readonly<CompletedTaskRowProps>) {
	return (
		<View style={TASK_ROW_STYLES.row}>
			<Pressable
				accessibilityLabel={`Reopen ${task.title}`}
				accessibilityRole="button"
				accessibilityState={{ disabled: isDisabled }}
				disabled={isDisabled}
				hitSlop={CIRCLE_HIT_SLOP}
				onPress={() => onReopen(task)}
				style={({ pressed }) => [
					TASK_ROW_STYLES.circle,
					styles.circle,
					pressed && styles.pressed,
				]}
			>
				<Text style={styles.check}>✓</Text>
			</Pressable>

			<Text style={styles.title}>{task.title}</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	circle: {
		borderColor: COLORS.faintForeground,
		backgroundColor: COLORS.faintForeground,
	},
	pressed: { opacity: 0.6 },
	check: { ...TEXT.caption, fontWeight: '700', color: COLORS.background },
	title: {
		...TEXT.sm,
		flex: 1,
		color: COLORS.mutedForeground,
		textDecorationLine: 'line-through',
	},
})
