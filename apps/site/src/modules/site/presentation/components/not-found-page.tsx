import { Link } from '@tanstack/react-router'

/** In the column of the blog and the changelog; the prerendered `/404.html` is what Caddy answers an unknown path with. */
export function NotFoundPage() {
	return (
		<main className="mx-auto flex w-full max-w-[680px] flex-1 flex-col gap-2 px-4 py-16 sm:px-6">
			<h1 className="text-2xl font-bold tracking-tight">Page not found</h1>

			<Link
				className="self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
				to="/"
			>
				Back to home
			</Link>
		</main>
	)
}
