import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekControlsProps {
	activeDayLabel: string
	onPrevious?: () => void
	onToday: () => void
	onNext?: () => void
}

const STEP_CLASS =
	'flex h-8 shrink-0 cursor-pointer items-center justify-center px-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent sm:px-2'

export function WeekControls({
	activeDayLabel,
	onPrevious,
	onToday,
	onNext,
}: Readonly<WeekControlsProps>) {
	return (
		<nav
			aria-label="Days"
			className="inline-flex items-center divide-x overflow-hidden rounded-md border"
		>
			<button
				aria-label="Previous day"
				className={STEP_CLASS}
				disabled={!onPrevious}
				onClick={onPrevious}
				type="button"
			>
				<ChevronLeft aria-hidden className="size-4" />
			</button>

			<button
				aria-label="Go to today"
				className="flex h-8 min-w-28 shrink-0 cursor-pointer items-center justify-center px-2 text-sm font-medium whitespace-nowrap tabular-nums transition-colors hover:bg-hover sm:px-3"
				onClick={onToday}
				title="Go to today"
				type="button"
			>
				{activeDayLabel}
			</button>

			<button
				aria-label="Next day"
				className={STEP_CLASS}
				disabled={!onNext}
				onClick={onNext}
				type="button"
			>
				<ChevronRight aria-hidden className="size-4" />
			</button>
		</nav>
	)
}
