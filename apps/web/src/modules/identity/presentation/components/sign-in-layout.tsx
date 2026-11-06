import type { PropsWithChildren } from 'react'

/** The signed-out frame: the Soonlane heading over the sign-in controls. */
export function SignInLayout({ children }: Readonly<PropsWithChildren>) {
	return (
		<main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-6 py-16">
			<div className="flex flex-col gap-1.5">
				<h1 className="text-2xl font-bold tracking-tight">Soonlane</h1>

				<p className="text-sm text-muted-foreground">
					Your tasks, from today onwards.
				</p>
			</div>

			{children}
		</main>
	)
}
