import { Tooltip } from '@soonlane/ui/components/tooltip'
import { Plus } from 'lucide-react'

interface AddTaskRowProps {
	autoFocus: boolean
	onClick: () => void
	label?: string
	/** Why nothing can be added: the row stays focusable, does nothing and shows this in a tooltip. */
	disabledHint?: string
}

export function AddTaskRow({
	autoFocus,
	onClick,
	label = 'Add task',
	disabledHint,
}: Readonly<AddTaskRowProps>) {
	const button = (
		<button
			aria-disabled={disabledHint ? true : undefined}
			autoFocus={autoFocus}
			className="group flex w-full cursor-pointer items-center gap-2.5 py-2 text-sm text-muted-foreground transition-colors outline-none hover:text-danger focus-visible:text-danger aria-disabled:cursor-default aria-disabled:opacity-50 aria-disabled:hover:text-muted-foreground"
			onClick={disabledHint ? undefined : onClick}
			type="button"
		>
			<span className="flex size-4.5 items-center justify-center rounded-full text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-focus-visible:bg-primary group-focus-visible:text-primary-foreground">
				<Plus aria-hidden className="size-4" />
			</span>
			{label}
		</button>
	)

	return disabledHint ? (
		<Tooltip label={disabledHint}>{button}</Tooltip>
	) : (
		button
	)
}
