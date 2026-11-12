import { usePickedLabels } from '@soonlane/app/labels/hooks/use-picked-labels'
import { orpcQuery } from '@soonlane/app/rpc-query'
import type { Label, Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	DEFAULT_TASK_PRIORITY,
	type TaskPriority,
	findTypedDueDates,
	parseTypedLabels,
	removeWords,
	parseTypedPriorities,
} from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'
import { type SetStateAction, useState } from 'react'

const NO_LABELS: Label[] = []

/** Whether `next` only drops tokens of `previous`; deleting a token keeps a chip pick. */
function isDeletion<TToken>(previous: TToken[], next: TToken[]) {
	const end = next.reduce(
		(from, token) =>
			previous.indexOf(token, from) + 1 || Number.POSITIVE_INFINITY,
		0
	)

	return end !== Number.POSITIVE_INFINITY
}

/** Only the date that is read (and highlighted) leaves the saved name; other dates stay as typed. */
function parseTitle(
	title: string,
	labels: Label[],
	dismissedWords: string[],
	today: CalendarDate,
	isDateRead: boolean
) {
	const labelWords = parseTypedLabels(title, labels)
	const dueDates = findTypedDueDates(title, labelWords, dismissedWords, today)
	const dueDateWord = isDateRead ? dueDates.at(-1) : undefined

	return {
		labelWords,
		dueDates,
		dueDateWord,
		...parseTypedPriorities(
			title,
			dueDateWord ? [...labelWords, dueDateWord] : labelWords
		),
	}
}

const toDates = (dueDates: { date: CalendarDate }[]) =>
	dueDates.map(({ date }) => date)

/**
 * The composer's title, priority, labels and typed due date. A "p1" to "p4" or
 * a date typed in the title sets the priority or due date unless its chip was
 * picked after it; a dismissed date word stays plain text until the next
 * task. An "@name" picks that label while the word stays, and unticking the
 * label deletes the word. An edited task keeps its title's words until the
 * owner edits the title.
 */
export function useTypedTitle(
	task: Task | undefined,
	today: CalendarDate,
	defaultLabels?: Label[]
) {
	const [title, setTitle] = useState(task?.title ?? '')
	const [isTitleEdited, setIsTitleEdited] = useState(false)
	const [chosenPriority, setChosenPriority] = useState<TaskPriority>(
		task?.priority ?? DEFAULT_TASK_PRIORITY
	)
	const [isChipPicked, setIsChipPicked] = useState(false)
	const [isDateChipPicked, setIsDateChipPicked] = useState(false)
	const [dismissedWords, setDismissedWords] = useState<string[]>([])
	const {
		pickedLabels: chipLabels,
		setLabels,
		resetLabels,
	} = usePickedLabels(defaultLabels)
	const { data } = useQuery(orpcQuery.labels.list.queryOptions())
	const labels = data?.labels ?? NO_LABELS
	const isDateRead = isTitleEdited && !isDateChipPicked
	const typed = parseTitle(title, labels, dismissedWords, today, isDateRead)
	const labelWords = isTitleEdited ? typed.labelWords : []
	const isTypedRead = isTitleEdited && !isChipPicked
	const typedPriority = isTypedRead ? typed.priorities.at(-1) : undefined
	const { dueDateWord } = typed
	const pickedLabels = [
		...new Map(
			[...chipLabels, ...labelWords.map(({ label }) => label)].map(label => [
				label.id,
				label,
			])
		).values(),
	]

	function changeTitle(next: string) {
		const nextTyped = parseTitle(
			next,
			labels,
			dismissedWords,
			today,
			isDateRead
		)
		if (!isDeletion(typed.priorities, nextTyped.priorities))
			setIsChipPicked(false)
		if (!isDeletion(toDates(typed.dueDates), toDates(nextTyped.dueDates)))
			setIsDateChipPicked(false)
		setTitle(next)
		setIsTitleEdited(true)
	}

	return {
		title,
		savedTitle: isTitleEdited ? typed.title : title,
		priority: typedPriority ?? chosenPriority,
		pickedLabels,
		highlights: [
			...(isTypedRead && typed.range ? [typed.range] : []),
			...(dueDateWord ? [dueDateWord] : []),
			...labelWords,
		],
		dueDateWord,
		changeTitle,
		pickPriority: (priority: TaskPriority) => {
			setChosenPriority(priority)
			setIsChipPicked(true)
		},
		pickDueDate: () => setIsDateChipPicked(true),
		dismissDueDateWord: () => {
			if (dueDateWord) setDismissedWords(words => [...words, dueDateWord.text])
		},
		pickLabels: (action: SetStateAction<Label[]>) => {
			// Only the picker's create updates by function, adding to the chip's own picks.
			if (typeof action === 'function') {
				setLabels(action)
				return
			}

			const isPicked = (label: Label) =>
				action.some(({ id }) => id === label.id)
			const droppedWords = labelWords.filter(({ label }) => !isPicked(label))

			if (droppedWords.length > 0) changeTitle(removeWords(title, droppedWords))
			setLabels(
				action.filter(
					label =>
						chipLabels.some(({ id }) => id === label.id) ||
						!labelWords.some(word => word.label.id === label.id)
				)
			)
		},
		reset: () => {
			setTitle('')
			setChosenPriority(DEFAULT_TASK_PRIORITY)
			setIsChipPicked(false)
			setIsDateChipPicked(false)
			setDismissedWords([])
			resetLabels()
		},
	}
}
