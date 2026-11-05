import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '../utils/cn.util'

const buttonVariants = cva(
	'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				primary:
					'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-hover',
				outline: 'border bg-transparent text-foreground hover:bg-hover',
				ghost: 'text-muted-foreground hover:bg-hover hover:text-foreground',
			},
			size: {
				default: 'h-9 px-3',
				lg: 'h-11 px-5',
				sm: 'h-8 px-2.5 text-label',
				icon: 'size-8',
			},
		},
		defaultVariants: {
			variant: 'primary',
			size: 'default',
		},
	}
)

type ButtonProps = ComponentProps<'button'> &
	VariantProps<typeof buttonVariants>

export function Button({
	className,
	variant,
	size,
	type,
	...props
}: Readonly<ButtonProps>) {
	return (
		<button
			className={cn(buttonVariants({ variant, size, className }))}
			data-slot="button"
			type={type === 'submit' ? 'submit' : 'button'}
			{...props}
		/>
	)
}

export { buttonVariants }
