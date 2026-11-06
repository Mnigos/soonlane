import { cn } from '@soonlane/ui/cn'
import { Link } from '@tanstack/react-router'

interface NotFoundProps {
	className?: string
}

export function NotFound({ className }: Readonly<NotFoundProps>) {
	return (
		<main
			className={cn(
				'mx-auto flex max-w-sm flex-col justify-center gap-2 px-6',
				className
			)}
		>
			<h1 className="text-xl font-semibold">Page not found</h1>

			<Link
				className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
				to="/"
			>
				Back to home
			</Link>
		</main>
	)
}
