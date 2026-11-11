import type { Label, Task } from '@soonlane/contracts'
import { DEFAULT_TASK_PRIORITY, type TaskPriority } from '@soonlane/domain'
import { useQuery } from '@tanstack/react-query'
import { type SetStateAction, useState } from 'react'
import { usePickedLabels } from '@/modules/labels/presentation/hooks/use-picked-labels'
import { orpcQuery } from '@/platform/rpc/rpc-query.client'
import { parseTypedLabels, removeWords } from '../../domain/typed-label.helper'
import { parseTypedPriorities } from '../../domain/typed-priority.helper'

const NO_LABELS: Label[] = []

/** Whether `next` only drops tokens of `previous`; deleting a token keeps a chip pick. */
function isDeletion(previous: TaskPriority[], next: TaskPriority[]) {
	const end = next.reduce(
		(from, token) =>
			previous.indexOf(token, from) + 1 || Number.POSITIVE_INFINITY,
		0
	)

	return end !== Number.POSITIVE_INFINITY
}

function parseTitle(title: string, labels: Label[]) {
	const labelWords = parseTypedLabels(title, labels)

	return { labelWords, ...parseTypedPriorities(title, labelWords) }
}

/**
 * The composer's title, priority and labels. A "p1" to "p4" typed in the title
 * sets the priority unless the chip was picked after it; an "@name" picks that
 * label while the word stays, and unticking the label deletes the word. An
 * edited task keeps its title's words until the owner edits the title.
 */
export function useTypedTitle(task: Task | undefined, defaultLabels?: Label[]) {
	const [title, setTitle] = useState(task?.title ?? '')
	const [isTitleEdited, setIsTitleEdited] = useState(false)
	const [chosenPriority, setChosenPriority] = useState<TaskPriority>(
		task?.priority ?? DEFAULT_TASK_PRIORITY
	)
	const [isChipPicked, setIsChipPicked] = useState(false)
	const {
		pickedLabels: chipLabels,
		setLabels,
		resetLabels,
	} = usePickedLabels(defaultLabels)
	const { data } = useQuery(orpcQuery.labels.list.queryOptions())
	const labels = data?.labels ?? NO_LABELS
	const typed = parseTitle(title, labels)
	const labelWords = isTitleEdited ? typed.labelWords : []
	const isTypedRead = isTitleEdited && !isChipPicked
	const typedPriority = isTypedRead ? typed.priorities.at(-1) : undefined
	const pickedLabels = [
		...new Map(
			[...chipLabels, ...labelWords.map(({ label }) => label)].map(label => [
				label.id,
				label,
			])
		).values(),
	]

	function changeTitle(next: string) {
		if (!isDeletion(typed.priorities, parseTitle(next, labels).priorities))
			setIsChipPicked(false)
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
			...labelWords,
		],
		changeTitle,
		pickPriority: (priority: TaskPriority) => {
			setChosenPriority(priority)
			setIsChipPicked(true)
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
			resetLabels()
		},
	}
}
