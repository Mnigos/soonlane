import type { Legal } from 'content-collections'
import { FormattedDate } from './formatted-date'
import { ProsePage } from './prose-page'

interface LegalPageProps {
	legal: Legal
}

export function LegalPage({ legal }: Readonly<LegalPageProps>) {
	return (
		<ProsePage
			byline={
				<span>
					Last updated <FormattedDate date={legal.updated} />
				</span>
			}
			mdx={legal.mdx}
			title={legal.title}
		/>
	)
}
