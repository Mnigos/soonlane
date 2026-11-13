import { Button, buttonVariants } from '@soonlane/ui/components/button'
import type { ReactNode } from 'react'

interface TodoistOfferProps {
	renderImportLink: (className: string) => ReactNode
	onDismiss: () => void
}

/** Points a new account at the host's Todoist import; Upcoming decides when it shows. */
export function TodoistOffer({
	renderImportLink,
	onDismiss,
}: Readonly<TodoistOfferProps>) {
	return (
		<section
			aria-labelledby="todoist-offer-title"
			className="flex flex-col items-start gap-3 border-b py-4"
		>
			<div className="flex flex-col gap-1">
				<h2 className="text-sm font-semibold" id="todoist-offer-title">
					Moving from Todoist?
				</h2>

				<p className="text-label text-muted-foreground">
					Import your open tasks, projects, and labels with read-only access and
					a preview before anything is saved.
				</p>
			</div>

			<div className="flex gap-2">
				{renderImportLink(buttonVariants({ size: 'sm' }))}

				<Button onClick={onDismiss} size="sm" variant="ghost">
					No thanks
				</Button>
			</div>
		</section>
	)
}
