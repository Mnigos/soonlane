import type { Label, RepeatInput, Task } from '@soonlane/contracts'
import {
	type CalendarDate,
	DEFAULT_TASK_PRIORITY,
	type TaskPriority,
	findTypedDueDates,
	findTypedRepeatRules,
	parseTypedLabels,
	removeWords,
	parseTypedPriorities,
} from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'
import { type SetStateAction, useState } from 'react'
import { orpcQuery } from '../../../rpc-query.client'
import { usePickedLabels } from '../../labels/hooks/use-picked-labels'
import { toRepeatInput } from '../helpers/task-edit.helper'

/** Which typed words the title reads: a chip picked by hand stops its kind from being read. */
interface TitleReads {
	isDateRead: boolean
	isRepeatRead: boolean
}

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

/**
 * Only the repeat phrase and date that are read (and highlighted) leave the saved name; others stay as typed. Every
 * repeat phrase, a dismissed one too, keeps its words from the date reader, so "every monday" never reads as "monday".
 */
function parseTitle(
	title: string,
	labels: Label[],
	dismissedWords: string[],
	today: CalendarDate,
	reads: TitleReads
) {
	const labelWords = parseTypedLabels(title, labels)
	const repeatPhrases = findTypedRepeatRules(title, labelWords, today)
	const repeats = repeatPhrases.filter(
		({ text }) => !dismissedWords.includes(text)
	)
	const repeatWord = reads.isRepeatRead ? repeats.at(-1) : undefined
	const dueDates = findTypedDueDates(
		title,
		[...labelWords, ...repeatPhrases],
		dismissedWords,
		today
	)
	const dueDateWord = reads.isDateRead ? dueDates.at(-1) : undefined

	return {
		labelWords,
		repeats,
		repeatWord,
		dueDates,
		dueDateWord,
		typedDueDate: reads.isDateRead
			? (dueDateWord ?? repeatWord)?.date
			: undefined,
		...parseTypedPriorities(
			title,
			[...labelWords, repeatWord, dueDateWord].filter(
				word => word !== undefined
			)
		),
	}
}

const toDates = (phrases: { date?: CalendarDate }[]) =>
	phrases.flatMap(({ date }) => (date ? [date] : []))
const toTexts = (phrases: { text: string }[]) => phrases.map(({ text }) => text)

/**
 * The composer's title, priority, labels, repeat rule and typed due date. A
 * "p1" to "p4", an "every …" phrase or a date typed in the title sets the
 * priority, repeat rule or due date unless its chip was picked after it; a
 * phrase naming a day ("every fri") also sets the due date unless a date word
 * does. A dismissed date word or repeat phrase stays plain text until the next
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
	const [chosenRepeat, setChosenRepeat] = useState(toRepeatInput(task))
	const [isRepeatChipPicked, setIsRepeatChipPicked] = useState(false)
	const [dismissedWords, setDismissedWords] = useState<string[]>([])
	const {
		pickedLabels: chipLabels,
		setLabels,
		resetLabels,
	} = usePickedLabels(defaultLabels)
	const { data } = useQuery(orpcQuery.labels.list.queryOptions())
	const labels = data?.labels ?? NO_LABELS
	const reads = {
		isDateRead: isTitleEdited && !isDateChipPicked,
		isRepeatRead: isTitleEdited && !isRepeatChipPicked,
	}
	const typed = parseTitle(title, labels, dismissedWords, today, reads)
	const labelWords = isTitleEdited ? typed.labelWords : []
	const isTypedRead = isTitleEdited && !isChipPicked
	const typedPriority = isTypedRead ? typed.priorities.at(-1) : undefined
	const { dueDateWord, repeatWord, typedDueDate } = typed
	const pickedLabels = [
		...new Map(
			[...chipLabels, ...labelWords.map(({ label }) => label)].map(label => [
				label.id,
				label,
			])
		).values(),
	]

	function changeTitle(next: string) {
		const nextTyped = parseTitle(next, labels, dismissedWords, today, reads)
		const dates = toDates([...typed.repeats, ...typed.dueDates])
		const nextDates = toDates([...nextTyped.repeats, ...nextTyped.dueDates])
		if (!isDeletion(typed.priorities, nextTyped.priorities))
			setIsChipPicked(false)
		if (!isDeletion(dates, nextDates)) setIsDateChipPicked(false)
		if (!isDeletion(toTexts(typed.repeats), toTexts(nextTyped.repeats)))
			setIsRepeatChipPicked(false)
		setTitle(next)
		setIsTitleEdited(true)
	}

	return {
		title,
		savedTitle: isTitleEdited ? typed.title : title,
		priority: typedPriority ?? chosenPriority,
		repeat: repeatWord?.rule ?? chosenRepeat,
		typedDueDate,
		pickedLabels,
		highlights: [
			...(isTypedRead && typed.range ? [typed.range] : []),
			...(dueDateWord ? [dueDateWord] : []),
			...(repeatWord ? [repeatWord] : []),
			...labelWords,
		],
		dismissible: [dueDateWord, repeatWord].flatMap(word =>
			word
				? [
						{
							start: word.start,
							end: word.end,
							onDismiss: () =>
								setDismissedWords(words => [...words, word.text]),
						},
					]
				: []
		),
		changeTitle,
		pickPriority: (priority: TaskPriority) => {
			setChosenPriority(priority)
			setIsChipPicked(true)
		},
		pickDueDate: () => setIsDateChipPicked(true),
		pickRepeat: (repeat: RepeatInput | undefined) => {
			setChosenRepeat(repeat)
			setIsRepeatChipPicked(true)
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
			setChosenRepeat(undefined)
			setIsRepeatChipPicked(false)
			setDismissedWords([])
			resetLabels()
		},
	}
}
