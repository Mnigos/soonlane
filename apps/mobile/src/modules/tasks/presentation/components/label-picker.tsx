import { isDefinedError } from '@orpc/client'
import { useCreateLabelMutation } from '@soonlane/app/labels/hooks/use-create-label-mutation'
import { orpcQuery } from '@soonlane/app/rpc-query'
import { searchByName } from '@soonlane/app/tasks/helpers/name-search.helper'
import type { Label } from '@soonlane/contracts'
import { useQuery } from '@tanstack/react-query'
import { type Dispatch, type SetStateAction, useState } from 'react'
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import { LABEL_COLORS } from '../task-colors.constants'

interface LabelPickerProps {
	value: Label[]
	onChange: Dispatch<SetStateAction<Label[]>>
}

/** The web's label picker: a "Type a label" field over the owner's labels to tick, and a row creating a new one. */
export function LabelPicker({ value, onChange }: Readonly<LabelPickerProps>) {
	const [query, setQuery] = useState('')
	const { data, isError } = useQuery(orpcQuery.labels.list.queryOptions())
	const createLabel = useCreateLabelMutation()
	const labels = data?.labels ?? []
	const { name, matches, isNewName } = searchByName(labels, query)
	const createError = createLabel.error

	function toggle(label: Label) {
		onChange(
			value.some(({ id }) => id === label.id)
				? value.filter(({ id }) => id !== label.id)
				: [...value, label]
		)
	}

	function create() {
		if (createLabel.isPending) return

		createLabel.mutate(
			{ name },
			{
				onSuccess: ({ label }) => {
					onChange(picked =>
						picked.some(({ id }) => id === label.id)
							? picked
							: [...picked, label]
					)
					setQuery('')
				},
			}
		)
	}

	return (
		<View style={styles.picker}>
			<TextInput
				accessibilityLabel="Type a label"
				autoCapitalize="none"
				autoCorrect={false}
				autoFocus
				keyboardAppearance="dark"
				onChangeText={nextQuery => {
					setQuery(nextQuery)
					if (createLabel.isError) createLabel.reset()
				}}
				onSubmitEditing={() => {
					if (isNewName) create()
				}}
				placeholder="Type a label"
				placeholderTextColor={COLORS.faintForeground}
				selectionColor={COLORS.primary}
				style={styles.field}
				submitBehavior="submit"
				value={query}
			/>

			<ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
				{matches.map(label => {
					const isPicked = value.some(({ id }) => id === label.id)

					return (
						<Pressable
							accessibilityRole="checkbox"
							accessibilityState={{ checked: isPicked }}
							key={label.id}
							onPress={() => toggle(label)}
							style={({ pressed }) => [styles.row, pressed && styles.pressed]}
						>
							<Text
								numberOfLines={1}
								style={[
									styles.name,
									{ color: LABEL_COLORS[label.color ?? 'charcoal'] },
								]}
							>
								{label.name}
							</Text>

							<View style={[styles.box, isPicked && styles.checkedBox]}>
								{isPicked && <Text style={styles.check}>✓</Text>}
							</View>
						</Pressable>
					)
				})}

				{isNewName && (
					<Pressable
						accessibilityRole="button"
						accessibilityState={{ disabled: createLabel.isPending }}
						disabled={createLabel.isPending}
						onPress={create}
						style={({ pressed }) => [
							styles.row,
							pressed && styles.pressed,
							createLabel.isPending && styles.disabled,
						]}
					>
						<Text numberOfLines={1} style={styles.create}>
							+ Create label &quot;{name}&quot;
						</Text>
					</Pressable>
				)}

				{data !== undefined && labels.length === 0 && name === '' && (
					<Text style={styles.note}>No labels yet</Text>
				)}

				{isError && (
					<Text style={styles.note}>Could not load your labels.</Text>
				)}

				{createError && (
					<Text accessibilityRole="alert" style={styles.error}>
						{isDefinedError(createError) && createError.code === 'CONFLICT'
							? createError.message
							: 'Could not create the label. Try again.'}
					</Text>
				)}
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	picker: {
		marginTop: 8,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: COLORS.border,
	},
	field: {
		...TEXT.sm,
		height: 40,
		color: COLORS.foreground,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: COLORS.border,
	},
	list: { maxHeight: 200 },
	row: {
		height: 40,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	pressed: { backgroundColor: COLORS.hover },
	disabled: { opacity: 0.5 },
	name: { ...TEXT.label, flex: 1 },
	box: {
		width: 16,
		height: 16,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1,
		borderColor: COLORS.borderStrong,
		borderRadius: RADIUS.md / 2,
	},
	checkedBox: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
	check: { ...TEXT.xs, color: COLORS.primaryForeground },
	create: { ...TEXT.label, flex: 1, color: COLORS.foreground },
	note: { ...TEXT.label, paddingVertical: 10, color: COLORS.faintForeground },
	error: { ...TEXT.caption, paddingVertical: 10, color: COLORS.danger },
})
