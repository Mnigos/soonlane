import { Link } from '@tanstack/react-router'

export function NotFound() {
	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-2 px-6">
			<h1 className="text-xl font-semibold">Page not found</h1>

			<Link
				className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
				to="/"
			>
				Back to Upcoming
			</Link>
		</main>
	)
}
