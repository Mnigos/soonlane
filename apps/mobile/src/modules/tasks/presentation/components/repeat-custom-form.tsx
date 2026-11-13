import {
	CUSTOM_REPEAT_UNIT_LABELS,
	type CustomRepeatUnit,
	isCustomRepeatUnit,
} from '@soonlane/app/tasks/helpers/repeat-choice.helper'
import { type RepeatInput, repeatInputSchema } from '@soonlane/contracts'
import { REPEAT_INTERVAL_MAX } from '@soonlane/domain'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { OutlineButton } from '@/modules/shell/presentation/components/outline-button'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'

interface RepeatCustomFormProps {
	initial: RepeatInput | undefined
	onSave: (repeat: RepeatInput) => void
	onCancel: () => void
}

/** The web's "Every [N] [days|weeks|months]" with Cancel and Save. */
export function RepeatCustomForm({
	initial,
	onSave,
	onCancel,
}: Readonly<RepeatCustomFormProps>) {
	const [count, setCount] = useState(String(initial?.interval ?? 1))
	const [unit, setUnit] = useState<CustomRepeatUnit>(
		initial && isCustomRepeatUnit(initial.unit) ? initial.unit : 'day'
	)
	const repeat = repeatInputSchema.safeParse({ unit, interval: Number(count) })

	function save() {
		if (repeat.success) onSave(repeat.data)
	}

	return (
		<View accessibilityLabel="Custom repeat" style={styles.form}>
			<View style={styles.line}>
				<Text style={styles.every}>Every</Text>

				<TextInput
					accessibilityLabel="Repeat every"
					autoFocus
					keyboardAppearance="dark"
					keyboardType="number-pad"
					maxLength={String(REPEAT_INTERVAL_MAX).length}
					onChangeText={setCount}
					selectionColor={COLORS.primary}
					style={[styles.count, !repeat.success && styles.invalid]}
					value={count}
				/>

				<View
					accessibilityLabel="Repeat unit"
					accessibilityRole="radiogroup"
					style={styles.units}
				>
					{Object.entries(CUSTOM_REPEAT_UNIT_LABELS).map(([value, label]) => (
						<Pressable
							accessibilityRole="radio"
							accessibilityState={{ checked: value === unit }}
							key={value}
							onPress={() => {
								if (isCustomRepeatUnit(value)) setUnit(value)
							}}
							style={[styles.unit, value === unit && styles.pickedUnit]}
						>
							<Text style={styles.unitLabel}>{label}</Text>
						</Pressable>
					))}
				</View>
			</View>

			<View style={styles.actions}>
				<OutlineButton onPress={onCancel}>Cancel</OutlineButton>

				<OutlineButton disabled={!repeat.success} onPress={save}>
					Save
				</OutlineButton>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	form: {
		gap: 12,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	every: { ...TEXT.label, color: COLORS.secondaryForeground },
	count: {
		...TEXT.label,
		width: 56,
		height: 36,
		paddingHorizontal: 8,
		color: COLORS.foreground,
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
	},
	invalid: { borderColor: COLORS.danger },
	units: { flex: 1, flexDirection: 'row', gap: 4 },
	unit: {
		flex: 1,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: StyleSheet.hairlineWidth,
		borderColor: COLORS.border,
		borderRadius: RADIUS.md,
	},
	pickedUnit: {
		borderColor: COLORS.borderStrong,
		backgroundColor: COLORS.hover,
	},
	unitLabel: { ...TEXT.label, color: COLORS.foreground },
	actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
})
