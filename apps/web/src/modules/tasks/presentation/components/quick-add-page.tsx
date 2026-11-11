import { useNavigate } from '@tanstack/react-router'
import { sendToDesktopHost } from '@/modules/shell/presentation/helpers/desktop-host.helper'
import { useDockBadgeQuery } from '../hooks/use-dock-badge-query'
import { useToday } from '../hooks/use-today'
import { TaskComposer } from './composer/task-composer'

function growForSuggestions(isOpen: boolean) {
	sendToDesktopHost({ type: 'quick-add-suggestions', isOpen })
}

/** The desktop app's Quick Add window: the task composer on its own, due today like the global Add task. */
export function QuickAddPage() {
	const today = useToday()
	const navigate = useNavigate()

	useDockBadgeQuery()

	function finish() {
		if (!sendToDesktopHost({ type: 'quick-add-done' }))
			void navigate({ to: '/app' })
	}

	return (
		<main className="min-h-dvh bg-card">
			{today && (
				<TaskComposer
					className="my-0 rounded-none border-0"
					defaultDueDate={today}
					onCancel={finish}
					onCreated={finish}
					onSuggestionsToggle={growForSuggestions}
					source="quick_add"
					today={today}
				/>
			)}
		</main>
	)
}
