import { cn } from '@soonlane/ui/cn'
import type { ComponentProps } from 'react'

interface GoalFieldProps extends ComponentProps<'input'> {
	label: string
}

export function GoalField({
	label,
	className,
	...props
}: Readonly<GoalFieldProps>) {
	return (
		<label className="flex flex-col gap-1 text-caption text-muted-foreground">
			{label}

			<input
				className={cn(
					'h-8 [appearance:textfield] rounded-md border bg-transparent px-2.5 text-label text-foreground outline-none placeholder:text-faint-foreground focus:border-border-strong aria-invalid:border-danger [&::-webkit-inner-spin-button]:appearance-none',
					className
				)}
				{...props}
			/>
		</label>
	)
}
