import { type PropsWithChildren, useMemo, useState } from 'react'
import { OpenEditorContext } from '../open-editor.context'

/**
 * Keeps one inline editor open per page: opening a composer or an edit card
 * closes the other. Memoized, so a page re-render (Upcoming's scroll) does not
 * re-render every task.
 */
export function OpenEditorProvider({ children }: Readonly<PropsWithChildren>) {
	const [openEditorId, setOpenEditorId] = useState<string>()
	const value = useMemo(
		() => ({ openEditorId, setOpenEditorId }),
		[openEditorId]
	)

	return <OpenEditorContext value={value}>{children}</OpenEditorContext>
}
