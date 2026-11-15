import { createFileRoute } from '@tanstack/react-router'
import { NotFoundPage } from '../components/not-found-page'

/** Exists to be prerendered as `/404.html`; the build cannot prerender a page that answers 404. */
export const Route = createFileRoute('/404')({
	component: NotFoundPage,
})
