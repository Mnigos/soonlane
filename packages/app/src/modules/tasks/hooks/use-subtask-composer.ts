import { getHostPorts } from '../../../host-ports.client'
import { useOpenEditor } from './use-open-editor'

/** The composer at the end of a task row's subtasks, one of the page's inline editors; `rowEditorId` is that row's editor id. */
export function useSubtaskComposer(rowEditorId: string) {
	const { capture } = getHostPorts()
	const { openEditorId, setOpenEditorId } = useOpenEditor()
	const editorId = `${rowEditorId}:subtask`

	return {
		isAdding: openEditorId === editorId,
		open: () => {
			setOpenEditorId(editorId)
			capture('composer_opened', { source: 'subtask' })
		},
		close: () => setOpenEditorId(undefined),
	}
}
