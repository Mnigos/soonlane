import { Button } from '@soonlane/ui/components/button'

interface TaskListErrorProps {
	onRetry: () => void
}

export function TaskListError({ onRetry }: Readonly<TaskListErrorProps>) {
	return (
		<div
			className="mt-4 flex items-center justify-between gap-4 rounded-md border px-3 py-2 text-sm"
			role="alert"
		>
			<p className="text-danger">Could not load your tasks.</p>

			<Button onClick={onRetry} size="sm" variant="outline">
				Try again
			</Button>
		</div>
	)
}
