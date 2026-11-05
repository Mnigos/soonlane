import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn.util'

export function Skeleton({
	className,
	...props
}: Readonly<ComponentProps<'div'>>) {
	return (
		<div
			className={cn('animate-pulse rounded-sm bg-hover', className)}
			data-slot="skeleton"
			{...props}
		/>
	)
}
