import type { Task } from '@soonlane/contracts'
import { useOpenEditor } from './use-open-editor'

/** Whether the editor belongs to the task's row: its edit card, its subtask composer (`:`) or a row inside its expansion (`/`). */
function isEditorInRow(editorId: string, taskId: string) {
	return (
		editorId === taskId ||
		editorId.startsWith(`${taskId}/`) ||
		editorId.startsWith(`${taskId}:`)
	)
}

/** Closes an edit card on one of `tasks` or under them before their rows hide or move away; it would reopen wherever the task shows up next. */
export function useCloseEditCard(tasks: Task[]) {
	const { openEditorId, setOpenEditorId } = useOpenEditor()

	return () => {
		if (
			openEditorId !== undefined &&
			tasks.some(({ id }) => isEditorInRow(openEditorId, id))
		)
			setOpenEditorId(undefined)
	}
}
