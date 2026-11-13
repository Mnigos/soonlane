import {
	splitByRanges,
	type TextRange,
} from '@soonlane/app/tasks/helpers/text-range.helper'
import { TASK_TITLE_MAX_LENGTH } from '@soonlane/domain'
import type { ComponentRef, Ref } from 'react'
import { StyleSheet, Text, TextInput, type TextInputProps } from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'

interface TitleInputProps extends Omit<TextInputProps, 'children' | 'value'> {
	title: string
	highlights: TextRange[]
	ref?: Ref<ComponentRef<typeof TextInput>>
}

/** 40% in hex alpha, the web's `bg-primary/40` behind a recognized word. */
const HIGHLIGHT_ALPHA = '66'

/** The "Task name" field, with the words the title reads (a date, "@label", "p1") tinted inside it as on the web. */
export function TitleInput({
	title,
	highlights,
	...props
}: Readonly<TitleInputProps>) {
	return (
		<TextInput
			accessibilityLabel="Task name"
			keyboardAppearance="dark"
			maxLength={TASK_TITLE_MAX_LENGTH}
			placeholder="Task name"
			placeholderTextColor={COLORS.faintForeground}
			selectionColor={COLORS.primary}
			style={styles.title}
			{...props}
		>
			{splitByRanges(title, highlights).map(({ start, end, text, isRange }) => (
				<Text key={`${start}:${end}`} style={isRange && styles.highlight}>
					{text}
				</Text>
			))}
		</TextInput>
	)
}

const styles = StyleSheet.create({
	title: { ...TEXT.base, minHeight: 32, color: COLORS.foreground },
	highlight: { backgroundColor: `${COLORS.primary}${HIGHLIGHT_ALPHA}` },
})
