import type { LinearIssue } from '@soonlane/contracts'
import { cn } from '@soonlane/ui/cn'

interface LinearStatusIconProps {
	/** Absent when the current status could not be read: a dotted grey ring. */
	state?: LinearIssue['state']
	className?: string
}

/** Linear's status ring for a workflow state type, in the state's own color. */
export function LinearStatusIcon({
	state,
	className,
}: Readonly<LinearStatusIconProps>) {
	return (
		<svg
			aria-hidden
			className={cn(
				'size-3.5 shrink-0',
				!state && 'text-faint-foreground',
				className
			)}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.5}
			style={state && { color: state.color }}
			viewBox="0 0 14 14"
		>
			{state?.type === 'completed' || state?.type === 'canceled' ? (
				<>
					<circle cx={7} cy={7} fill="currentColor" r={6.25} stroke="none" />

					<path
						d={
							state.type === 'completed'
								? 'M4.3 7.2l1.8 1.8 3.6-3.8'
								: 'M4.8 4.8l4.4 4.4M9.2 4.8l-4.4 4.4'
						}
						stroke="var(--color-background)"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</>
			) : (
				<>
					<circle
						cx={7}
						cy={7}
						r={5.5}
						strokeDasharray={
							state?.type === 'backlog' ? '2 1.6' : state ? undefined : '1 2'
						}
					/>

					{state?.type === 'started' && (
						<path
							d="M7 3.5A3.5 3.5 0 0 1 7 10.5Z"
							fill="currentColor"
							stroke="none"
						/>
					)}
				</>
			)}
		</svg>
	)
}
