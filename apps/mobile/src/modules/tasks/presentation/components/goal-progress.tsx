import type { Task } from '@soonlane/contracts'
import { StyleSheet, Text, View } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'

interface GoalProgressProps {
	goal: NonNullable<Task['goal']>
}

/** The web's "20/50 push-ups" caption over a 2px bar. */
export function GoalProgress({ goal }: Readonly<GoalProgressProps>) {
	return (
		<View style={styles.goal}>
			<Text style={styles.caption}>
				{goal.progress}/{goal.target}
				{goal.unit && ` ${goal.unit}`}
			</Text>

			<View style={styles.track}>
				<View
					style={[
						styles.fill,
						{ width: `${(goal.progress / goal.target) * 100}%` },
					]}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	goal: { gap: 4 },
	caption: { ...TEXT.caption, color: COLORS.mutedForeground },
	track: {
		height: 2,
		maxWidth: 192,
		overflow: 'hidden',
		backgroundColor: COLORS.border,
	},
	fill: { height: 2, backgroundColor: COLORS.mutedForeground },
})
