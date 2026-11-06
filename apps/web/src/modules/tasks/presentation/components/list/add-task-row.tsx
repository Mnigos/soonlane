import { Plus } from 'lucide-react'

interface AddTaskRowProps {
	onClick: () => void
}

export function AddTaskRow({ onClick }: Readonly<AddTaskRowProps>) {
	return (
		<button
			className="group flex w-full cursor-pointer items-center gap-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-danger"
			onClick={onClick}
			type="button"
		>
			<span className="flex size-4.5 items-center justify-center rounded-full text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
				<Plus aria-hidden className="size-4" />
			</span>
			Add task
		</button>
	)
}
