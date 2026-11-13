import { provideHostPorts } from '@soonlane/app/host-ports'
import { provideRpcLink } from '@soonlane/app/rpc-query'
import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { apiLink } from './platform/rpc/api-link.client'
import { router } from './router'
import './styles.css'

provideRpcLink(apiLink)
provideHostPorts({
	showToast: (message, options) => {
		toast(message, options)
	},
	dismissToast: id => {
		toast.dismiss(id)
	},
	// The desktop app asks for no analytics consent yet, so it sends no events.
	capture: () => undefined,
	subscribeToResume: onResume => {
		document.addEventListener('visibilitychange', onResume)

		return () => document.removeEventListener('visibilitychange', onResume)
	},
})

const root = document.querySelector('#root')

if (!root) throw new Error('index.html has no #root')

createRoot(root).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>
)
