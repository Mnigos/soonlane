import { use } from 'react'
import { ConsentContext } from '../consent.context'

export function useConsent() {
	const value = use(ConsentContext)

	if (!value) throw new Error('useConsent needs a ConsentProvider.')

	return value
}
