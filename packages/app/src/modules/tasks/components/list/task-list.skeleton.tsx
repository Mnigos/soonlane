import { Skeleton } from '@soonlane/ui/components/skeleton'

const PLACEHOLDER_SECTIONS = ['first', 'second', 'third'] as const

function PlaceholderSections() {
	return PLACEHOLDER_SECTIONS.map(section => (
		<div className="flex flex-col gap-3" key={section}>
			<Skeleton className="h-4 w-48" />

			<Skeleton className="h-4 w-24" />
		</div>
	))
}

export function TaskListSkeleton() {
	return (
		<div
			aria-busy
			aria-label="Loading"
			className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 pt-4 md:px-10"
		>
			<Skeleton className="h-7 w-32" />

			<PlaceholderSections />
		</div>
	)
}

/** The list part of {@link TaskListSkeleton}, under a page heading that is already shown. */
export function TaskSectionsSkeleton() {
	return (
		<div aria-busy aria-label="Loading" className="flex flex-col gap-8 pt-6">
			<PlaceholderSections />
		</div>
	)
}
