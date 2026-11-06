import { createFileRoute, redirect } from '@tanstack/react-router'
import { sendToDesktopHost } from '@/modules/shell/presentation/helpers/desktop-host.helper'
import { QuickAddPage } from '../components/quick-add-page'

export const Route = createFileRoute('/_session/app/quick-add')({
	// The guard runs in the browser, so a signed-out Quick Add window closes instead of showing the login page.
	ssr: false,
	beforeLoad: ({ context }) => {
		if (context.me.user) return

		sendToDesktopHost({ type: 'quick-add-done' })
		throw redirect({ to: '/login' })
	},
	head: () => ({ meta: [{ title: 'Quick Add · Soonlane' }] }),
	component: QuickAddPage,
})
