import { cn } from '@soonlane/ui/cn'
import { ChevronDown } from 'lucide-react'
import type { PropsWithChildren } from 'react'

interface SectionToggleProps extends PropsWithChildren {
	isOpen: boolean
	controls: string
	onToggle: () => void
}

/** A section heading's collapse button, its chevron hanging in the left gutter from `md`. */
export function SectionToggle({
	isOpen,
	controls,
	onToggle,
	children,
}: Readonly<SectionToggleProps>) {
	return (
		<button
			aria-controls={controls}
			aria-expanded={isOpen}
			className="flex cursor-pointer items-center gap-1.5 md:-ml-6"
			onClick={onToggle}
			type="button"
		>
			<ChevronDown
				aria-hidden
				className={cn(
					'size-4.5 text-muted-foreground transition-transform',
					!isOpen && '-rotate-90'
				)}
			/>
			{children}
		</button>
	)
}
