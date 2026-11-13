import { PRESET_REPEAT_UNITS } from '@soonlane/app/tasks/helpers/repeat-choice.helper'
import type { RepeatInput } from '@soonlane/contracts'
import {
	type CalendarDate,
	formatRepeatRule,
	type RepeatRule,
} from '@soonlane/domain'
import { useState } from 'react'
import { ActionSheetIOS, StyleSheet, Text } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'
import { DetailRow } from './detail-row'
import { RepeatCustomForm } from './repeat-custom-form'

interface RepeatMenuProps {
	dueDate: CalendarDate
	value: RepeatRule | undefined
	onChange: (repeat: RepeatInput | undefined) => void
}

/** The web's Repeat menu as an action sheet: the presets labelled from the due date, Custom..., and Clear repeat once a rule is set. */
export function RepeatMenu({
	dueDate,
	value,
	onChange,
}: Readonly<RepeatMenuProps>) {
	const [isCustom, setIsCustom] = useState(false)

	function openSheet() {
		const presets = PRESET_REPEAT_UNITS.map(unit =>
			formatRepeatRule({
				unit,
				interval: 1,
				anchor:
					value?.unit === unit && value.interval === 1 ? value.anchor : dueDate,
			})
		)
		const options = [
			...presets,
			'Custom...',
			...(value ? ['Clear repeat'] : []),
			'Cancel',
		]

		ActionSheetIOS.showActionSheetWithOptions(
			{
				title: 'Repeat',
				options,
				cancelButtonIndex: options.length - 1,
				userInterfaceStyle: 'dark',
			},
			index => {
				const unit = PRESET_REPEAT_UNITS[index]

				if (unit) onChange({ unit, interval: 1 })
				else if (index === presets.length) setIsCustom(true)
				else if (value && index === presets.length + 1) onChange(undefined)
			}
		)
	}

	return (
		<>
			<DetailRow isOpen={isCustom} label="Repeat" onPress={openSheet}>
				{value && <Text style={styles.rule}>{formatRepeatRule(value)}</Text>}
			</DetailRow>

			{isCustom && (
				<RepeatCustomForm
					initial={value}
					onCancel={() => setIsCustom(false)}
					onSave={repeat => {
						onChange(repeat)
						setIsCustom(false)
					}}
				/>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	rule: { ...TEXT.sm, color: COLORS.foreground, textAlign: 'right' },
})
