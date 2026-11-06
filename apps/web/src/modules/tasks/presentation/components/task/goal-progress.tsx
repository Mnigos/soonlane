import type { Task } from '@soonlane/contracts'

interface GoalProgressProps {
	goal: NonNullable<Task['goal']>
}

/** "20/50 push-ups" over a 2px bar in neutral greys. */
export function GoalProgress({ goal }: Readonly<GoalProgressProps>) {
	return (
		<div className="flex flex-col gap-1">
			<p className="text-caption text-muted-foreground">
				{goal.progress}/{goal.target}
				{goal.unit && ` ${goal.unit}`}
			</p>

			<div aria-hidden className="h-0.5 max-w-48 overflow-hidden bg-border">
				<div
					className="h-full origin-left bg-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none"
					style={{ transform: `scaleX(${goal.progress / goal.target})` }}
				/>
			</div>
		</div>
	)
}
