import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekControlsProps {
	onPrevious?: () => void
	onToday: () => void
	onNext?: () => void
}

const STEP_CLASS =
	'flex h-8 cursor-pointer items-center justify-center px-1.5 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent sm:px-2'

/** Day navigation: the arrows step to the previous or next day, Today returns to today's section. */
export function WeekControls({
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
				className="flex h-8 cursor-pointer items-center px-2 text-sm font-medium transition-colors hover:bg-hover sm:px-3"
				onClick={onToday}
				type="button"
			>
				Today
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
