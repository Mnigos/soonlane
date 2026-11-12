import type { Task } from '@soonlane/contracts'
import { useOpenEditor } from './use-open-editor'

/** Closes an edit card on one of `tasks` before their rows hide or move away; it would reopen wherever the task shows up next. */
export function useCloseEditCard(tasks: Task[]) {
	const { openEditorId, setOpenEditorId } = useOpenEditor()

	return () => {
		if (tasks.some(({ id }) => id === openEditorId)) setOpenEditorId(undefined)
	}
}
