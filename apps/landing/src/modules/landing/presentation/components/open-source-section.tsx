import { HOME_OPEN_SOURCE } from '../home.constants'
import { GITHUB_URL } from '../landing.constants'
import { HomeSection } from './home-section'

export function OpenSourceSection() {
	return (
		<HomeSection title={HOME_OPEN_SOURCE.title}>
			<div className="flex flex-col items-start gap-4 text-landing-body text-secondary-foreground">
				{HOME_OPEN_SOURCE.paragraphs.map(paragraph => (
					<p key={paragraph}>{paragraph}</p>
				))}

				<a
					className="rounded-sm text-foreground underline underline-offset-4"
					href={GITHUB_URL}
				>
					{HOME_OPEN_SOURCE.linkLabel}
				</a>
			</div>
		</HomeSection>
	)
}
