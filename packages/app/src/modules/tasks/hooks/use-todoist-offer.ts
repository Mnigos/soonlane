import type { CalendarDate } from '@soonlane/domain'
import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useHostApp } from '../../../hooks/use-host-app'
import { orpcQuery } from '../../../rpc-query.client'
import {
	readTodoistOfferDismissed,
	saveTodoistOfferDismissed,
} from '../../shell/helpers/todoist-offer-preference.helper'
import { isEmptyTaskList } from '../helpers/task-list.helper'

interface UpcomingListState {
	today: CalendarDate
	/** Upcoming's first range has not loaded yet. */
	isListPending: boolean
	/** Upcoming's first range loaded without a task. */
	isListEmpty: boolean
}

/** A query selected down to whether the account has none of its items. */
type EmptinessQuery = UseQueryResult<boolean>

function isLoadedEmpty(query: EmptinessQuery) {
	return query.isSuccess && query.data
}

/** An item, even in data a failed refetch kept, or a failure rules the offer out: the offer needs every query loaded empty. */
function rulesOut(query: EmptinessQuery) {
	return query.isError || query.data === false
}

/**
 * Whether Upcoming offers the Todoist import: only to a new account with no open task, project or label. The list of
 * every open task loads once the first range is empty, and `isListHeld` keeps the list back on the first load until the
 * offer is decided, so the offer never pushes a shown list down. Anything that rules the offer out ends the wait, a
 * failed query included. Whether the offer came with the list is latched when the list is first shown: the hold never
 * returns, and an offer the list was shown without never appears above it later.
 */
export function useTodoistOffer({
	today,
	isListPending,
	isListEmpty,
}: Readonly<UpcomingListState>) {
	const { renderTodoistImportLink } = useHostApp()
	const [isDismissed, setIsDismissed] = useState(readTodoistOfferDismissed)
	const [isOfferedWithList, setIsOfferedWithList] = useState<boolean>()
	// The host's import link follows this status, so the offer waits for it as well.
	const status = useQuery(orpcQuery.todoist.status.queryOptions())
	const projects = useQuery(
		orpcQuery.projects.list.queryOptions({
			select: list => list.projects.length === 0,
		})
	)
	const labels = useQuery(
		orpcQuery.labels.list.queryOptions({
			select: list => list.labels.length === 0,
		})
	)
	const isRuledOut =
		isDismissed ||
		isOfferedWithList === false ||
		(!status.isLoading && !renderTodoistImportLink) ||
		[projects, labels].some(rulesOut)
	// The list without a range also holds the tasks due after the loaded weeks.
	const tasks = useQuery(
		orpcQuery.tasks.list.queryOptions({
			input: !isRuledOut && isListEmpty ? { today } : skipToken,
			select: isEmptyTaskList,
		})
	)
	const canOffer = isListEmpty && !isRuledOut
	const isDeciding =
		isListPending ||
		(canOffer &&
			!rulesOut(tasks) &&
			[status, projects, labels, tasks].some(query => query.isLoading))
	const importLink =
		canOffer && [projects, labels, tasks].every(isLoadedEmpty)
			? renderTodoistImportLink
			: undefined

	if (isOfferedWithList === undefined && !isDeciding)
		setIsOfferedWithList(importLink !== undefined)

	return {
		importLink,
		/** The first load is still deciding whether the offer goes above the list. */
		isListHeld: isOfferedWithList === undefined && isDeciding,
		dismiss: () => {
			setIsDismissed(true)
			void saveTodoistOfferDismissed()
		},
	}
}
