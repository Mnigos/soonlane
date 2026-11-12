import { use } from 'react'
import { HostAppContext } from '../host-app.context'

export function useHostApp() {
	const value = use(HostAppContext)

	if (!value) throw new Error('useHostApp needs a HostAppContext provider.')

	return value
}
