import { GOAL_UNIT_MAX_LENGTH } from '@soonlane/domain'
import { StyleSheet, View } from 'react-native'
import { OutlineButton } from '@/modules/shell/presentation/components/outline-button'
import { COLORS } from '@/tokens.gen'
import { GoalField } from './goal-field'

interface GoalFieldsProps {
	target: string
	unit: string
	isInvalid: boolean
	onTargetChange: (target: string) => void
	onUnitChange: (unit: string) => void
}

/** The web goal popover's "Target" and "Unit" fields, and "Remove goal" while a target is set. */
export function GoalFields({
	target,
	unit,
	isInvalid,
	onTargetChange,
	onUnitChange,
}: Readonly<GoalFieldsProps>) {
	return (
		<View style={styles.fields}>
			<View style={styles.row}>
				<GoalField
					isInvalid={isInvalid}
					keyboardType="number-pad"
					label="Target"
					onChangeText={onTargetChange}
					placeholder="50"
					value={target}
				/>

				<GoalField
					label="Unit"
					maxLength={GOAL_UNIT_MAX_LENGTH}
					onChangeText={onUnitChange}
					placeholder="push-ups"
					value={unit}
				/>
			</View>

			{target !== '' && (
				<OutlineButton
					onPress={() => {
						onTargetChange('')
						onUnitChange('')
					}}
				>
					Remove goal
				</OutlineButton>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	fields: {
		gap: 12,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	row: { flexDirection: 'row', gap: 8 },
})
