import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/labels/$name')({
	head: ({ params }) => ({ meta: [{ title: `${params.name} · Soonlane` }] }),
	component: LabelRoute,
})

function LabelRoute() {
	const { name } = Route.useParams()

	return (
		<main className="mx-auto w-full max-w-3xl px-6 pb-24 md:px-10">
			<h1 className="pt-1 text-xl font-bold md:pt-4">{name}</h1>
		</main>
	)
}
