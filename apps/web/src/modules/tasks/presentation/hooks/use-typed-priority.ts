import type { Task } from '@soonlane/contracts'
import { DEFAULT_TASK_PRIORITY, type TaskPriority } from '@soonlane/domain'
import { useState } from 'react'
import { parseTypedPriorities } from '../../domain/typed-priority.helper'

/** Whether `next` only drops tokens of `previous`; deleting a token keeps a chip pick. */
function isDeletion(previous: TaskPriority[], next: TaskPriority[]) {
	const end = next.reduce(
		(from, token) =>
			previous.indexOf(token, from) + 1 || Number.POSITIVE_INFINITY,
		0
	)

	return end !== Number.POSITIVE_INFINITY
}

/**
 * The composer's title and priority: a "p1" to "p4" typed in the title sets
 * the priority unless the chip was picked after it, and `highlights` marks
 * that word. An edited task keeps its title's words and its saved priority
 * until the owner edits the title.
 */
export function useTypedPriority(task: Task | undefined) {
	const [title, setTitle] = useState(task?.title ?? '')
	const [isTitleEdited, setIsTitleEdited] = useState(false)
	const [chosenPriority, setChosenPriority] = useState<TaskPriority>(
		task?.priority ?? DEFAULT_TASK_PRIORITY
	)
	const [isChipPicked, setIsChipPicked] = useState(false)
	const typed = parseTypedPriorities(title)
	const isTypedRead = isTitleEdited && !isChipPicked
	const typedPriority = isTypedRead ? typed.priorities.at(-1) : undefined

	return {
		title,
		savedTitle: isTitleEdited ? typed.title : title,
		priority: typedPriority ?? chosenPriority,
		highlights: isTypedRead && typed.range ? [typed.range] : [],
		changeTitle: (next: string) => {
			if (!isDeletion(typed.priorities, parseTypedPriorities(next).priorities))
				setIsChipPicked(false)
			setTitle(next)
			setIsTitleEdited(true)
		},
		pickPriority: (priority: TaskPriority) => {
			setChosenPriority(priority)
			setIsChipPicked(true)
		},
		resetTitleAndPriority: () => {
			setTitle('')
			setChosenPriority(DEFAULT_TASK_PRIORITY)
			setIsChipPicked(false)
		},
	}
}
