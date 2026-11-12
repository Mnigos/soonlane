import { use } from 'react'
import { NoDateSectionContext } from '../no-date-section.context'

export function useNoDateSection() {
	const value = use(NoDateSectionContext)

	if (!value) throw new Error('useNoDateSection needs a NoDateSectionContext.')

	return value
}
