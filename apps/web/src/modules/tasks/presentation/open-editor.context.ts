import { createContext } from 'react'

/**
 * The page's one open inline editor: a day's date for its composer,
 * the label's id for the label view's composer, a task id for its edit card.
 */
export interface OpenEditorContextValue {
	openEditorId: string | undefined
	setOpenEditorId: (editorId: string | undefined) => void
}

export const OpenEditorContext = createContext<OpenEditorContextValue | null>(
	null
)
