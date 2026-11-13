import {
	addMonths,
	CALENDAR_HORIZON_MONTHS,
	type CalendarDate,
	DAYS_PER_WEEK,
	type CalendarDayTone,
	clampToCalendar,
	formatLongDate,
	formatMonthShortYear,
	getCalendarDayTone,
	getDayOfMonth,
	getMonthOffset,
	getMonthStart,
	getVisibleWeeks,
	WEEKDAY_INITIALS,
} from '@soonlane/domain'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'

interface MonthCalendarProps {
	selected?: CalendarDate
	today: CalendarDate
	onSelect: (date: CalendarDate) => void
}

const DAY_TONE_COLORS = {
	past: COLORS.faintForeground,
	today: COLORS.danger,
	weekend: COLORS.secondaryForeground,
	weekday: COLORS.foreground,
} as const satisfies Record<CalendarDayTone, string>
/** A fixed seventh, so a month's short last week keeps its days under their weekdays. */
const DAY_WIDTH = `${100 / DAYS_PER_WEEK}%` as const

/**
 * The web's calendar a month at a time, from today's week to the picker's ten-year horizon: today in coral with a dot,
 * the chosen day on a red circle, past days faint and inert.
 */
export function MonthCalendar({
	selected,
	today,
	onSelect,
}: Readonly<MonthCalendarProps>) {
	const [shownIndex, setShownIndex] = useState(() =>
		getMonthOffset(today, clampToCalendar(selected ?? today, today))
	)
	const month = addMonths(getMonthStart(today), shownIndex)
	const navButtons = [
		{ label: 'Previous month', glyph: '‹', index: shownIndex - 1 },
		{ label: 'This month', glyph: '•', index: 0 },
		{ label: 'Next month', glyph: '›', index: shownIndex + 1 },
	]

	return (
		<View>
			<View style={styles.header}>
				<Text accessibilityRole="header" style={styles.month}>
					{formatMonthShortYear(month)}
				</Text>

				{navButtons.map(({ label, glyph, index }) => {
					const isDisabled =
						index < 0 || index > CALENDAR_HORIZON_MONTHS || index === shownIndex

					return (
						<Pressable
							accessibilityLabel={label}
							accessibilityRole="button"
							accessibilityState={{ disabled: isDisabled }}
							disabled={isDisabled}
							hitSlop={6}
							key={label}
							onPress={() => setShownIndex(index)}
							style={({ pressed }) => [
								styles.nav,
								pressed && styles.pressed,
								isDisabled && styles.disabled,
							]}
						>
							<Text style={styles.glyph}>{glyph}</Text>
						</Pressable>
					)
				})}
			</View>

			<View style={styles.week}>
				{WEEKDAY_INITIALS.map((weekday, index) => (
					<Text
						accessible={false}
						key={`${weekday}-${String(index)}`}
						style={styles.weekday}
					>
						{weekday}
					</Text>
				))}
			</View>

			{getVisibleWeeks(month, today).map(week => (
				<View key={week.find(Boolean)} style={styles.week}>
					{week.map((date, index) => {
						if (!date)
							return <View key={`blank-${String(index)}`} style={styles.day} />

						const tone = getCalendarDayTone(date, today)
						const isSelected = date === selected

						return (
							<Pressable
								accessibilityLabel={formatLongDate(date)}
								accessibilityRole="button"
								accessibilityState={{
									selected: isSelected,
									disabled: tone === 'past',
								}}
								disabled={tone === 'past'}
								key={date}
								onPress={() => onSelect(date)}
								style={styles.day}
							>
								{({ pressed }) => (
									<View
										style={[
											styles.circle,
											pressed && styles.pressed,
											isSelected && styles.selected,
										]}
									>
										<Text
											style={[
												styles.dayNumber,
												{ color: DAY_TONE_COLORS[tone] },
												(tone === 'today' || isSelected) && styles.bold,
												isSelected && styles.selectedNumber,
											]}
										>
											{getDayOfMonth(date)}
										</Text>

										{tone === 'today' && <View style={styles.dot} />}
									</View>
								)}
							</Pressable>
						)
					})}
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	header: {
		height: 40,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	month: {
		...TEXT.label,
		flex: 1,
		fontWeight: '700',
		color: COLORS.foreground,
	},
	nav: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: RADIUS.md,
	},
	pressed: { backgroundColor: COLORS.hover },
	disabled: { opacity: 0.3 },
	glyph: { ...TEXT.lg, color: COLORS.secondaryForeground },
	week: { flexDirection: 'row' },
	weekday: {
		...TEXT.micro,
		width: DAY_WIDTH,
		textAlign: 'center',
		color: COLORS.secondaryForeground,
	},
	day: {
		width: DAY_WIDTH,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	circle: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 16,
	},
	selected: { backgroundColor: COLORS.primary },
	dayNumber: { ...TEXT.label },
	bold: { fontWeight: '600' },
	selectedNumber: { color: COLORS.primaryForeground },
	dot: {
		position: 'absolute',
		bottom: 3,
		width: 3,
		height: 3,
		borderRadius: 1.5,
		backgroundColor: COLORS.secondaryForeground,
	},
})
