import { allLegals } from 'content-collections'

export function getLegalDocument(slug: 'privacy' | 'terms') {
	const legal = allLegals.find(({ _meta }) => _meta.path === slug)

	if (!legal) throw new Error(`Missing legal document: ${slug}.mdx`)

	return legal
}
