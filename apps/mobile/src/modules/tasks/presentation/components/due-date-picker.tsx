import { getHostPorts } from '@soonlane/app/host-ports'
import { DUE_DATE_SHORTCUT_CHOICES } from '@soonlane/app/tasks/helpers/due-date-choice.constants'
import { type CalendarDate, getDueDateShortcuts } from '@soonlane/domain'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'
import { MonthCalendar } from './month-calendar'

interface DueDatePickerProps {
	dueDate: CalendarDate | undefined
	hasTime: boolean
	today: CalendarDate
	noDateHint: string | undefined
	onDateChange: (date: CalendarDate) => void
	/** Clears the date with its time and repeat rule. */
	onNoDate: () => void
}

/**
 * The web's date picker without its text field: the quick dates (the chosen day left out), No date while a date is
 * set, and the calendar. Each pick is captured as on the web's date chip.
 */
export function DueDatePicker({
	dueDate,
	hasTime,
	today,
	noDateHint,
	onDateChange,
	onNoDate,
}: Readonly<DueDatePickerProps>) {
	const { capture } = getHostPorts()
	const rows = [
		...getDueDateShortcuts(today)
			.filter(({ date }) => date !== dueDate)
			.map(({ id, label, date, hint }) => ({
				id,
				label,
				hint,
				onPress: () => {
					capture('date_picker_used', {
						choice: DUE_DATE_SHORTCUT_CHOICES[id],
						hasTime,
					})
					onDateChange(date)
				},
			})),
		...(dueDate
			? [
					{
						id: 'no-date',
						label: 'No date',
						hint: noDateHint,
						onPress: () => {
							capture('date_picker_used', { choice: 'no_date', hasTime })
							onNoDate()
						},
					},
				]
			: []),
	]

	return (
		<View style={styles.picker}>
			{rows.map(({ id, label, hint, onPress }) => (
				<Pressable
					accessibilityLabel={hint ? `${label}, ${hint}` : label}
					accessibilityRole="button"
					key={id}
					onPress={onPress}
					style={({ pressed }) => [styles.row, pressed && styles.pressed]}
				>
					<Text style={styles.label}>{label}</Text>

					<Text style={styles.hint}>{hint}</Text>
				</Pressable>
			))}

			<MonthCalendar
				onSelect={date => {
					capture('date_picker_used', { choice: 'calendar', hasTime })
					onDateChange(date)
				}}
				selected={dueDate}
				today={today}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	picker: {
		paddingBottom: 8,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	row: {
		height: 44,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	pressed: { backgroundColor: COLORS.hover },
	label: { ...TEXT.label, fontWeight: '500', color: COLORS.foreground },
	hint: { ...TEXT.label, color: COLORS.secondaryForeground },
})
