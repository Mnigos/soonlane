import { sendToDesktopHost } from '@soonlane/app/shell/helpers/desktop-host.helper'
import { QuickAddPage } from '@soonlane/app/tasks/components/quick-add-page'
import { createFileRoute, redirect } from '@tanstack/react-router'

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
