import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '../components/legal-page'
import { getLegalDocument } from '../helpers/legal-document.helper'
import { buildPageHead } from '../helpers/seo.helper'
import { SITE_NAME } from '../site.constants'

const legal = getLegalDocument('terms')

export const Route = createFileRoute('/terms')({
	head: () =>
		buildPageHead({
			title: `${legal.title} · ${SITE_NAME}`,
			description: legal.description,
			path: '/terms',
		}),
	component: () => <LegalPage legal={legal} />,
})
