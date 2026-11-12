import { useNavigate } from '@tanstack/react-router'
import { useCallback, useRef, useSyncExternalStore } from 'react'
import {
	focusTaskRow,
	getFocusedTaskRow,
} from '@/modules/tasks/presentation/helpers/task-focus.helper'
import { isShortcutKeydown } from '@/utils/keyboard-shortcut.util'

/** How long after "g" its second key still counts. */
const SEQUENCE_MS = 1000
const SEQUENCE_VIEWS: Partial<Record<string, '/app' | '/app/today'>> = {
	u: '/app',
	t: '/app/today',
}
const ROW_STEPS: Partial<Record<string, 1 | -1>> = {
	j: 1,
	k: -1,
	arrowdown: 1,
	arrowup: -1,
}
const getNothing = () => undefined

interface KeyboardShortcutsOptions {
	onAddTask: () => void
	onShowShortcuts: () => void
}

/**
 * The app's shortcuts outside a task row: Add task, the shortcut list, "g" sequences to the views and
 * moving between task rows. The arrows move only from a selected row, so they scroll the page otherwise.
 */
export function useKeyboardShortcuts({
	onAddTask,
	onShowShortcuts,
}: KeyboardShortcutsOptions) {
	const navigate = useNavigate()
	const sequenceStartRef = useRef(Number.NEGATIVE_INFINITY)
	const subscribe = useCallback(() => {
		function handleKeyDown(event: KeyboardEvent) {
			const isSequence =
				event.timeStamp - sequenceStartRef.current < SEQUENCE_MS
			sequenceStartRef.current = Number.NEGATIVE_INFINITY

			if (!isShortcutKeydown(event)) return

			const key = event.key.toLowerCase()
			const view = isSequence ? SEQUENCE_VIEWS[key] : undefined
			const step = ROW_STEPS[key]

			if (view) void navigate({ to: view })
			else if (key === 'g') sequenceStartRef.current = event.timeStamp
			else if (key === 'q') onAddTask()
			else if (key === '?') onShowShortcuts()
			else if (step && (!key.startsWith('arrow') || getFocusedTaskRow()))
				focusTaskRow(step)
			else return

			// Taken in the capture phase before React: a row must not also read the "t" after "g", nor a focused "…" open its menu on an arrow.
			event.preventDefault()
			event.stopPropagation()
		}

		document.addEventListener('keydown', handleKeyDown, true)

		return () => document.removeEventListener('keydown', handleKeyDown, true)
	}, [navigate, onAddTask, onShowShortcuts])

	useSyncExternalStore(subscribe, getNothing, getNothing)
}
