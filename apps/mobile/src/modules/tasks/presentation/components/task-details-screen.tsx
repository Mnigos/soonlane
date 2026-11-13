import {
	getNoDateHint,
	getScheduledDate,
	getTaskEdit,
} from '@soonlane/app/tasks/helpers/task-edit.helper'
import { useDeleteTask } from '@soonlane/app/tasks/hooks/use-delete-task'
import { useTypedTitle } from '@soonlane/app/tasks/hooks/use-typed-title'
import { useUpdateTask } from '@soonlane/app/tasks/hooks/use-update-task'
import { goalInputSchema, type Task, taskSchema } from '@soonlane/contracts'
import {
	type CalendarDate,
	DEFAULT_TASK_PRIORITY,
	getDueChipLabel,
	getEditedRule,
	TASK_DESCRIPTION_MAX_LENGTH,
} from '@soonlane/domain'
import { Stack, useRouter } from 'expo-router'
import { type ComponentRef, useRef, useState } from 'react'
import {
	Alert,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native'
import { COLORS, TEXT } from '@/tokens.gen'
import { useCachedTask } from '../hooks/use-cached-task'
import { showPrioritySheet } from '../priority-sheet.helper'
import {
	DUE_TONE_COLORS,
	LABEL_COLORS,
	PRIORITY_COLORS,
} from '../task-colors.constants'
import { DetailRow } from './detail-row'
import { DueDatePicker } from './due-date-picker'
import { DueTimeField } from './due-time-field'
import { GoalFields } from './goal-fields'
import { GoalProgress } from './goal-progress'
import { LabelPicker } from './label-picker'
import { LogProgressControls } from './log-progress-controls'
import { RepeatMenu } from './repeat-menu'
import { TitleInput } from './title-input'

interface TaskDetailsScreenProps {
	id: string
	today: CalendarDate
}

interface TaskDetailsProps {
	task: Task
	today: CalendarDate
}

type Panel = 'date' | 'labels' | 'goal'

/** The web's edit card as a screen: every field saves together with the check, and Back leaves the task as it was. */
function TaskDetails({ task, today }: Readonly<TaskDetailsProps>) {
	// oxlint-disable-next-line react/hook-use-state -- the task as the screen opened on, never set, so a refetch while it is open is not an edit
	const [openedTask] = useState(task)
	const router = useRouter()
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
	} = useTypedTitle(openedTask, today, openedTask.labels)
	const [description, setDescription] = useState(openedTask.description ?? '')
	const [dueDate, setDueDate] = useState(openedTask.dueDate)
	const [dueTimeText, setDueTimeText] = useState(openedTask.dueTime ?? '')
	const [goalTarget, setGoalTarget] = useState(
		openedTask.goal ? String(openedTask.goal.target) : ''
	)
	const [goalUnit, setGoalUnit] = useState(openedTask.goal?.unit ?? '')
	const [openPanel, setOpenPanel] = useState<Panel>()
	const titleRef = useRef<ComponentRef<typeof TextInput>>(null)
	const { updateTask } = useUpdateTask(today)
	const { deleteTask } = useDeleteTask(today)
	const dueTime = taskSchema.shape.dueTime.safeParse(dueTimeText || undefined)
	const goal = goalInputSchema
		.optional()
		.safeParse(
			goalTarget === ''
				? undefined
				: { target: Number(goalTarget), unit: goalUnit.trim() || undefined }
		)
	const scheduledDate = getScheduledDate(
		openedTask,
		typedDueDate ?? dueDate,
		repeat,
		today
	)
	// The rule names the anchor the save keeps, e.g. the 31st of a monthly task now due Feb 28.
	const savedRule =
		scheduledDate && getEditedRule(openedTask, scheduledDate, repeat)
	const dueChip = scheduledDate
		? getDueChipLabel(scheduledDate, { dueTime: dueTime.data }, today)
		: { text: 'No date', tone: 'later' as const }

	function togglePanel(panel: Panel) {
		setOpenPanel(open => (open === panel ? undefined : panel))
	}

	function save() {
		if (savedTitle.trim() === '') titleRef.current?.focus()
		if (!goal.success) setOpenPanel('goal')
		if (savedTitle.trim() === '' || !dueTime.success || !goal.success) return

		const edit = getTaskEdit(openedTask, {
			title: savedTitle,
			description,
			dueDate: scheduledDate,
			dueTime: dueTime.data,
			// The phone has no duration field: the task keeps its own, which goes with the time, as on the web.
			durationMinutes:
				dueTime.data === undefined ? undefined : openedTask.durationMinutes,
			priority,
			repeat,
			labels: pickedLabels,
			goal: goal.data,
			project: openedTask.project,
		})

		if (edit) updateTask({ ...edit, id: openedTask.id, today })
		router.back()
	}

	function confirmDelete() {
		Alert.alert(
			'Delete task?',
			`The "${task.title}" task will be permanently deleted.`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						deleteTask(task)
						router.back()
					},
				},
			],
			{ userInterfaceStyle: 'dark' }
		)
	}

	return (
		<>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Save task"
					icon="checkmark"
					onPress={save}
					tintColor={COLORS.primary}
					variant="prominent"
				/>
			</Stack.Toolbar>

			<ScrollView
				automaticallyAdjustKeyboardInsets
				contentContainerStyle={styles.content}
				contentInsetAdjustmentBehavior="automatic"
				keyboardDismissMode="interactive"
				keyboardShouldPersistTaps="handled"
				style={styles.screen}
			>
				<TitleInput
					highlights={highlights}
					onChangeText={changeTitle}
					onFocus={() => setOpenPanel(undefined)}
					ref={titleRef}
					returnKeyType="done"
					title={title}
				/>

				<TextInput
					accessibilityLabel="Description"
					keyboardAppearance="dark"
					maxLength={TASK_DESCRIPTION_MAX_LENGTH}
					onChangeText={setDescription}
					placeholder="Description"
					placeholderTextColor={COLORS.faintForeground}
					selectionColor={COLORS.primary}
					style={styles.description}
					value={description}
				/>

				<DetailRow
					isOpen={openPanel === 'date'}
					label="Date"
					onPress={() => togglePanel('date')}
				>
					<Text
						style={[styles.value, { color: DUE_TONE_COLORS[dueChip.tone] }]}
					>
						{dueChip.text}
					</Text>
				</DetailRow>

				{openPanel === 'date' && (
					<DueDatePicker
						dueDate={scheduledDate}
						hasTime={dueTime.data !== undefined}
						noDateHint={getNoDateHint(dueTime.data, repeat !== undefined)}
						onDateChange={date => {
							setDueDate(date)
							pickDueDate()
							setOpenPanel(undefined)
						}}
						onNoDate={() => {
							setDueDate(undefined)
							pickDueDate()
							setDueTimeText('')
							pickRepeat(undefined)
							setOpenPanel(undefined)
						}}
						today={today}
					/>
				)}

				{scheduledDate && (
					<>
						<DueTimeField
							isInvalid={!dueTime.success}
							onChange={setDueTimeText}
							value={dueTimeText}
						/>

						<RepeatMenu
							dueDate={scheduledDate}
							onChange={rule => {
								// Keeps the shown date, which the old rule may have moved off the picked day.
								setDueDate(scheduledDate)
								pickRepeat(rule)
							}}
							value={savedRule}
						/>
					</>
				)}

				<DetailRow
					label="Priority"
					onPress={() => showPrioritySheet(priority, pickPriority)}
				>
					{priority !== DEFAULT_TASK_PRIORITY && (
						<Text style={[styles.value, { color: PRIORITY_COLORS[priority] }]}>
							P{priority}
						</Text>
					)}
				</DetailRow>

				<DetailRow
					isOpen={openPanel === 'labels'}
					label="Labels"
					onPress={() => togglePanel('labels')}
				>
					{pickedLabels.map(label => (
						<Text
							key={label.id}
							style={[
								styles.value,
								{ color: LABEL_COLORS[label.color ?? 'charcoal'] },
							]}
						>
							{label.name}
						</Text>
					))}
				</DetailRow>

				{openPanel === 'labels' && (
					<LabelPicker onChange={pickLabels} value={pickedLabels} />
				)}

				<DetailRow
					isOpen={openPanel === 'goal'}
					label="Goal"
					onPress={() => togglePanel('goal')}
				>
					{goal.data && (
						<Text style={styles.value}>
							{goal.data.target}

							{goal.data.unit && ` ${goal.data.unit}`}
						</Text>
					)}
				</DetailRow>

				{openPanel === 'goal' && (
					<GoalFields
						isInvalid={!goal.success}
						onTargetChange={setGoalTarget}
						onUnitChange={setGoalUnit}
						target={goalTarget}
						unit={goalUnit}
					/>
				)}

				{task.goal && (
					<View style={styles.progress}>
						<GoalProgress goal={task.goal} />

						<LogProgressControls
							onCompleted={router.back}
							task={task}
							today={today}
						/>
					</View>
				)}

				<Pressable
					accessibilityRole="button"
					onPress={confirmDelete}
					style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
				>
					<Text style={styles.deleteLabel}>Delete</Text>
				</Pressable>
			</ScrollView>
		</>
	)
}

/** The task a row opened, read from the cached lists so a logged amount shows at once; empty once it leaves them. */
export function TaskDetailsScreen({
	id,
	today,
}: Readonly<TaskDetailsScreenProps>) {
	const task = useCachedTask(id)

	return task && <TaskDetails task={task} today={today} />
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: COLORS.background },
	content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
	description: {
		...TEXT.label,
		minHeight: 28,
		marginBottom: 12,
		color: COLORS.foreground,
	},
	value: { ...TEXT.sm, color: COLORS.foreground },
	progress: { gap: 12, paddingVertical: 12 },
	delete: {
		height: 44,
		justifyContent: 'center',
		marginTop: 24,
	},
	pressed: { backgroundColor: COLORS.hover },
	deleteLabel: { ...TEXT.sm, fontWeight: '500', color: COLORS.danger },
})
