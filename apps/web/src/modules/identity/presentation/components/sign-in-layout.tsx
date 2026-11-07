import type { PropsWithChildren } from 'react'

interface SignInLayoutProps extends PropsWithChildren {
	heading?: string
	description?: string
}

export function SignInLayout({
	heading = 'Soonlane',
	description = 'Your tasks, from today onwards.',
	children,
}: Readonly<SignInLayoutProps>) {
	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-16">
			<div className="flex flex-col gap-1.5">
				<h1 className="text-2xl font-bold tracking-tight">{heading}</h1>

				<p className="text-sm text-muted-foreground">{description}</p>
			</div>

			{children}
		</main>
	)
}
