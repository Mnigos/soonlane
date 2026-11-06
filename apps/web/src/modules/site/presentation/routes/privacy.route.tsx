import { createFileRoute } from '@tanstack/react-router'
import { LegalPage } from '../components/legal-page'
import { getLegalDocument } from '../helpers/legal-document.helper'
import { buildPageHead } from '../helpers/seo.helper'
import { SITE_NAME } from '../site.constants'

const legal = getLegalDocument('privacy')

export const Route = createFileRoute('/_site/privacy')({
	head: () =>
		buildPageHead({
			title: `${legal.title} · ${SITE_NAME}`,
			description: legal.description,
			path: '/privacy',
		}),
	component: () => <LegalPage legal={legal} />,
})
