import type { Legal } from 'content-collections'
import type { MDXContent } from 'mdx/types'
import { FormattedDate } from './formatted-date'
import { ProsePage } from './prose-page'

interface LegalPageProps {
	legal: Legal
	content: MDXContent
}

export function LegalPage({ legal, content }: Readonly<LegalPageProps>) {
	return (
		<ProsePage
			byline={
				<span>
					Last updated <FormattedDate date={legal.updated} />
				</span>
			}
			content={content}
			title={legal.title}
		/>
	)
}
