import { getHostPorts } from '@soonlane/app/host-ports'
import {
	getNoDateHint,
	getScheduledDate,
} from '@soonlane/app/tasks/helpers/task-edit.helper'
import { useCreateTaskMutation } from '@soonlane/app/tasks/hooks/use-create-task-mutation'
import { useTypedTitle } from '@soonlane/app/tasks/hooks/use-typed-title'
import type { Label, Project } from '@soonlane/contracts'
import {
	type CalendarDate,
	DEFAULT_TASK_PRIORITY,
	getDueChipLabel,
	getDueDateShortcuts,
} from '@soonlane/domain'
import { type ComponentRef, useRef, useState } from 'react'
import {
	KeyboardAvoidingView,
	Modal,
	Pressable,
	StyleSheet,
	Text,
	type TextInput,
	View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, RADIUS, TEXT } from '@/tokens.gen'
import { showDueDateSheet } from '../due-date-sheet.helper'
import { showPrioritySheet } from '../priority-sheet.helper'
import {
	DUE_TONE_COLORS,
	LABEL_COLORS,
	PRIORITY_COLORS,
} from '../task-colors.constants'
import { ComposerChip } from './composer-chip'
import { LabelPicker } from './label-picker'
import { TitleInput } from './title-input'

interface TaskComposerProps {
	defaultDueDate: CalendarDate
	defaultLabels?: Label[]
	/** A project's view puts its tasks in that project; the phone has no project chip to change it. */
	defaultProject?: Project
	source: Parameters<typeof useCreateTaskMutation>[0]
	today: CalendarDate
	onClose: () => void
}

/** 60% in hex alpha, the web dialog's backdrop. */
const BACKDROP_ALPHA = '99'

/**
 * The web's task composer as a card above the keyboard: the title reads dates, "@label" and "p1" to "p4" through the
 * shared hook and tints them, and the chips set them by tap. A created task clears the card for the next one.
 */
export function TaskComposer({
	defaultDueDate,
	defaultLabels,
	defaultProject,
	source,
	today,
	onClose,
}: Readonly<TaskComposerProps>) {
	const {
		title,
		savedTitle,
		priority,
		repeat,
		typedDueDate,
		pickedLabels,
		highlights,
		changeTitle,
		pickPriority,
		pickDueDate,
		pickRepeat,
		pickLabels,
		reset,
	} = useTypedTitle(undefined, today, defaultLabels)
	const { capture } = getHostPorts()
	const { bottom } = useSafeAreaInsets()
	const [dueDate, setDueDate] = useState<CalendarDate | undefined>(
		defaultDueDate
	)
	const [isPickingLabels, setIsPickingLabels] = useState(false)
	const scheduledDate = getScheduledDate(
		undefined,
		typedDueDate ?? dueDate,
		repeat,
		today
	)
	const dueChip = scheduledDate
		? getDueChipLabel(scheduledDate, {}, today)
		: { text: 'No date', tone: 'later' as const }
	const [firstLabel] = pickedLabels
	const titleRef = useRef<ComponentRef<typeof TextInput>>(null)
	// isPending lags a render, so a quick second tap would send the task twice.
	const isSubmittingRef = useRef(false)
	const { mutate, isPending, error } = useCreateTaskMutation(source, today)

	function submit() {
		if (savedTitle.trim() === '') titleRef.current?.focus()
		if (savedTitle.trim() === '' || isPending || isSubmittingRef.current) return

		isSubmittingRef.current = true
		mutate(
			{
				title: savedTitle,
				dueDate: scheduledDate,
				priority,
				repeat,
				labelIds: pickedLabels.map(({ id }) => id),
				projectId: defaultProject?.id,
			},
			{
				onSuccess: () => {
					reset()
					setIsPickingLabels(false)
					titleRef.current?.focus()
				},
				onSettled: () => {
					isSubmittingRef.current = false
				},
			}
		)
	}

	function openDateSheet() {
		showDueDateSheet({
			shortcuts: getDueDateShortcuts(today).filter(
				({ date }) => date !== scheduledDate
			),
			hasNoDate: scheduledDate !== undefined,
			noDateHint: getNoDateHint(undefined, repeat !== undefined),
			onChange: (date, choice) => {
				capture('date_picker_used', { choice, hasTime: false })
				setDueDate(date)
				pickDueDate()
				if (!date) pickRepeat(undefined)
			},
		})
	}

	return (
		<Modal animationType="fade" onRequestClose={onClose} transparent visible>
			{/* The card pads the home indicator itself, so with the keyboard up it sits right above the keys. */}
			<KeyboardAvoidingView
				behavior="padding"
				keyboardVerticalOffset={-bottom}
				style={styles.screen}
			>
				<Pressable
					accessibilityLabel="Cancel"
					accessibilityRole="button"
					onPress={onClose}
					style={styles.backdrop}
				/>

				<View style={[styles.card, { paddingBottom: 12 + bottom }]}>
					<TitleInput
						autoFocus
						highlights={highlights}
						onChangeText={changeTitle}
						onFocus={() => setIsPickingLabels(false)}
						onSubmitEditing={submit}
						ref={titleRef}
						returnKeyType="done"
						submitBehavior="submit"
						title={title}
					/>

					{isPickingLabels && (
						<LabelPicker onChange={pickLabels} value={pickedLabels} />
					)}

					<View style={styles.chips}>
						<ComposerChip
							accessibilityLabel={
								scheduledDate ? `Due ${dueChip.text}` : 'No due date'
							}
							color={DUE_TONE_COLORS[dueChip.tone]}
							onPress={openDateSheet}
						>
							{dueChip.text}
						</ComposerChip>

						<ComposerChip
							accessibilityLabel={`Priority ${priority}`}
							color={
								priority === DEFAULT_TASK_PRIORITY
									? undefined
									: PRIORITY_COLORS[priority]
							}
							onPress={() => showPrioritySheet(priority, pickPriority)}
						>
							{priority === DEFAULT_TASK_PRIORITY ? 'Priority' : `P${priority}`}
						</ComposerChip>

						<ComposerChip
							accessibilityLabel="Labels"
							color={firstLabel && LABEL_COLORS[firstLabel.color ?? 'charcoal']}
							isOpen={isPickingLabels}
							onPress={() => {
								// Focusing the title closes the picker and keeps the keyboard, so the card stays above it.
								if (isPickingLabels) titleRef.current?.focus()
								else setIsPickingLabels(true)
							}}
						>
							{firstLabel?.name ?? 'Labels'}

							{pickedLabels.length > 1 && ` +${pickedLabels.length - 1}`}
						</ComposerChip>

						<Pressable
							accessibilityLabel="Add task"
							accessibilityRole="button"
							accessibilityState={{ disabled: savedTitle.trim() === '' }}
							onPress={submit}
							style={({ pressed }) => [
								styles.send,
								pressed && styles.sendPressed,
							]}
						>
							<Text style={styles.arrow}>↑</Text>
						</Pressable>
					</View>

					{error && (
						<Text accessibilityRole="alert" style={styles.error}>
							Could not add the task. Try again.
						</Text>
					)}
				</View>
			</KeyboardAvoidingView>
		</Modal>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, justifyContent: 'flex-end' },
	backdrop: {
		...StyleSheet.absoluteFill,
		backgroundColor: `${COLORS.background}${BACKDROP_ALPHA}`,
	},
	card: {
		padding: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: COLORS.border,
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		backgroundColor: COLORS.card,
	},
	chips: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginTop: 8,
	},
	send: {
		width: 32,
		height: 32,
		marginLeft: 'auto',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: RADIUS.md,
		backgroundColor: COLORS.primary,
	},
	sendPressed: { backgroundColor: COLORS.primaryHover },
	arrow: { ...TEXT.lg, fontWeight: '700', color: COLORS.primaryForeground },
	error: { ...TEXT.caption, paddingTop: 8, color: COLORS.danger },
})
