import type { ComponentProps } from 'react'
import { cn } from '../utils/cn.util'

/** A key cap for a keyboard shortcut. */
export function Kbd({ className, ...props }: Readonly<ComponentProps<'kbd'>>) {
	return (
		<kbd
			className={cn(
				'inline-flex h-5 min-w-5 items-center justify-center rounded-sm border bg-hover px-1 font-sans text-caption text-secondary-foreground',
				className
			)}
			data-slot="kbd"
			{...props}
		/>
	)
}
