import type { CalendarDate } from '@soonlist/domain'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekControlsProps {
	previousWeek?: CalendarDate
	nextWeek: CalendarDate
}

const CONTROL_CLASS =
	'flex h-8 items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-hover hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-40'

export function WeekControls({
	previousWeek,
	nextWeek,
}: Readonly<WeekControlsProps>) {
	return (
		<nav
			aria-label="Week"
			className="inline-flex items-center divide-x overflow-hidden rounded-md border"
		>
			{previousWeek ? (
				<Link
					aria-label="Previous week"
					className={CONTROL_CLASS}
					search={{ week: previousWeek }}
					to="/"
				>
					<ChevronLeft aria-hidden className="size-4" />
				</Link>
			) : (
				<span
					aria-disabled
					aria-label="Previous week"
					className={CONTROL_CLASS}
				>
					<ChevronLeft aria-hidden className="size-4" />
				</span>
			)}
			<Link
				className="flex h-8 items-center px-3 text-sm font-medium transition-colors hover:bg-hover"
				search={{}}
				to="/"
			>
				Today
			</Link>
			<Link
				aria-label="Next week"
				className={CONTROL_CLASS}
				search={{ week: nextWeek }}
				to="/"
			>
				<ChevronRight aria-hidden className="size-4" />
			</Link>
		</nav>
	)
}
