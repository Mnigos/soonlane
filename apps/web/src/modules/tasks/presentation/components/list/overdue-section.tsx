import { cn } from '@soonlist/ui/cn'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function OverdueSection() {
	const [isOpen, setIsOpen] = useState(true)

	return (
		<section aria-labelledby="overdue-heading" className="pt-4">
			<div className="flex items-center justify-between gap-4 border-b pb-2">
				<h2 className="text-sm font-semibold" id="overdue-heading">
					<button
						aria-controls="overdue-tasks"
						aria-expanded={isOpen}
						className="-ml-6 flex cursor-pointer items-center gap-1.5"
						onClick={() => setIsOpen(open => !open)}
						type="button"
					>
						<ChevronDown
							aria-hidden
							className={cn(
								'size-4.5 text-muted-foreground transition-transform',
								!isOpen && '-rotate-90'
							)}
						/>
						Overdue
					</button>
				</h2>
				<button
					className="cursor-pointer text-sm font-medium text-danger hover:underline disabled:cursor-default disabled:opacity-50 disabled:hover:no-underline"
					disabled
					type="button"
				>
					Reschedule
				</button>
			</div>
			{isOpen && (
				<p className="py-3 text-sm text-faint-foreground" id="overdue-tasks">
					Nothing overdue.
				</p>
			)}
		</section>
	)
}
