import { useOpenEditor } from './use-open-editor'

/** Whether the editor belongs to the row: its edit card, its subtask composer (`:`) or a row inside its expansion (`/`). */
function isEditorInRow(editorId: string, rowEditorId: string) {
	return (
		editorId === rowEditorId ||
		editorId.startsWith(`${rowEditorId}/`) ||
		editorId.startsWith(`${rowEditorId}:`)
	)
}

/** Closes an edit card in one of the rows or under them before they hide or move away; it would reopen wherever the task shows up next. */
export function useCloseEditCard(rowEditorIds: readonly string[]) {
	const { openEditorId, setOpenEditorId } = useOpenEditor()

	return () => {
		if (
			openEditorId !== undefined &&
			rowEditorIds.some(rowEditorId => isEditorInRow(openEditorId, rowEditorId))
		)
			setOpenEditorId(undefined)
	}
}
