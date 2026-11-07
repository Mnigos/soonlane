import { createFileRoute, redirect } from '@tanstack/react-router'
import { sendToDesktopHost } from '@/modules/shell/presentation/helpers/desktop-host.helper'
import { QuickAddPage } from '../components/quick-add-page'

export const Route = createFileRoute('/_session/app/quick-add')({
	// Client-only so the signed-out guard can tell the desktop app to close the window.
	ssr: false,
	beforeLoad: ({ context }) => {
		if (context.me.user) return

		sendToDesktopHost({ type: 'quick-add-done' })
		throw redirect({ to: '/login' })
	},
	head: () => ({ meta: [{ title: 'Quick Add · Soonlane' }] }),
	component: QuickAddPage,
})
