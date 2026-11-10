import { Switch as BaseSwitch } from '@base-ui/react/switch'
import type { ComponentProps } from 'react'
import { cn } from '../utils/cn.util'

type SwitchProps = ComponentProps<typeof BaseSwitch.Root>

/** An on/off switch, red when on like Todoist's; name it with `aria-labelledby` or a wrapping label. */
export function Switch({ className, ...props }: Readonly<SwitchProps>) {
	return (
		<BaseSwitch.Root
			className={cn(
				'inline-flex h-5 w-8 shrink-0 cursor-pointer items-center rounded-full bg-control p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-checked:bg-primary data-disabled:cursor-default data-disabled:opacity-50',
				className
			)}
			data-slot="switch"
			{...props}
		>
			<BaseSwitch.Thumb className="size-4 rounded-full bg-primary-foreground transition-transform data-checked:translate-x-3 motion-reduce:transition-none" />
		</BaseSwitch.Root>
	)
}
