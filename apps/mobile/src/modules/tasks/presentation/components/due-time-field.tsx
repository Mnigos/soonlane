import { Pressable, StyleSheet, Text, TextInput } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'
import { DetailRow } from './detail-row'

interface DueTimeFieldProps {
	value: string
	isInvalid: boolean
	onChange: (text: string) => void
}

/** The web's time field as a typed "HH:MM" with a clear button; the text turns coral until it is a time. */
export function DueTimeField({
	value,
	isInvalid,
	onChange,
}: Readonly<DueTimeFieldProps>) {
	return (
		<DetailRow label="Time">
			<TextInput
				accessibilityLabel="Due time"
				keyboardAppearance="dark"
				keyboardType="numbers-and-punctuation"
				maxLength={5}
				onChangeText={onChange}
				placeholder="09:00"
				placeholderTextColor={COLORS.faintForeground}
				returnKeyType="done"
				selectionColor={COLORS.primary}
				style={[styles.time, isInvalid && styles.invalid]}
				value={value}
			/>

			{value !== '' && (
				<Pressable
					accessibilityLabel="Clear time"
					accessibilityRole="button"
					hitSlop={8}
					onPress={() => onChange('')}
				>
					<Text style={styles.clear}>×</Text>
				</Pressable>
			)}
		</DetailRow>
	)
}

const styles = StyleSheet.create({
	time: { ...TEXT.sm, flex: 1, textAlign: 'right', color: COLORS.foreground },
	invalid: { color: COLORS.danger },
	clear: { ...TEXT.lg, color: COLORS.secondaryForeground },
})
