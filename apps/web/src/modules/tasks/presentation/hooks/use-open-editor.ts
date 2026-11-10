import { use } from 'react'
import { OpenEditorContext } from '../open-editor.context'

export function useOpenEditor() {
	const value = use(OpenEditorContext)

	if (!value) throw new Error('useOpenEditor needs an OpenEditorProvider.')

	return value
}
