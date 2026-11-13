import { useLogProgress } from '@soonlane/app/tasks/hooks/use-log-progress'
import { logProgressInputSchema, type Task } from '@soonlane/contracts'
import type { CalendarDate } from '@soonlane/domain'
import { useState } from 'react'
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import { GoalField } from './goal-field'

interface LogProgressControlsProps {
	task: Task
	today: CalendarDate
	/** Called when a log reaches the target, which completes the task and takes it off every list. */
	onCompleted: () => void
}

/** The web's "+1" and "Log amount" under a task's goal; a negative amount corrects a mistake. */
export function LogProgressControls({
	task,
	today,
	onCompleted,
}: Readonly<LogProgressControlsProps>) {
	const { logProgress } = useLogProgress(today)
	const [text, setText] = useState('')
	const amount = logProgressInputSchema.shape.amount.safeParse(Number(text))

	function log(value: number) {
		logProgress(task, value)
		if (task.goal && task.goal.progress + value >= task.goal.target)
			onCompleted()
	}

	return (
		<View style={styles.controls}>
			<GoalField
				isInvalid={text !== '' && !amount.success}
				keyboardType="numbers-and-punctuation"
				label="Amount"
				onChangeText={setText}
				onSubmitEditing={() => {
					if (!amount.success) return

					setText('')
					log(amount.data)
				}}
				placeholder="10"
				value={text}
			/>

			<Pressable
				accessibilityLabel={`Add 1 to ${task.title}`}
				accessibilityRole="button"
				onPress={() => {
					// The failure toast sits where the keyboard would cover it.
					Keyboard.dismiss()
					log(1)
				}}
				style={({ pressed }) => [styles.addOne, pressed && styles.pressed]}
			>
				<Text style={styles.addOneLabel}>+1</Text>
			</Pressable>
		</View>
	)
}

const styles = StyleSheet.create({
	controls: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
	addOne: {
		height: 36,
		paddingHorizontal: 12,
		justifyContent: 'center',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
	},
	pressed: { backgroundColor: COLORS.hover },
	addOneLabel: { ...TEXT.sm, fontWeight: '500', color: COLORS.foreground },
})
