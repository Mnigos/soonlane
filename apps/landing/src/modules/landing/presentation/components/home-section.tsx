import { cn } from '@soonlane/ui/cn'
import type { PropsWithChildren } from 'react'

interface HomeSectionProps extends PropsWithChildren {
	title?: string
	className?: string
}

export function HomeSection({
	title,
	className,
	children,
}: Readonly<HomeSectionProps>) {
	return (
		<section>
			<div
				className={cn(
					'mx-auto w-full max-w-[1120px] px-4 py-16 sm:px-6 lg:py-24',
					title && 'grid gap-6 lg:grid-cols-[5fr_7fr] lg:gap-16',
					className
				)}
			>
				{title && <h2 className="text-landing-title text-balance">{title}</h2>}

				{children}
			</div>
		</section>
	)
}
