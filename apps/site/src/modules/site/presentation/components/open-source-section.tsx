import { LANDING_OPEN_SOURCE } from '../landing.constants'
import { GITHUB_URL } from '../site.constants'
import { LandingSection } from './landing-section'

export function OpenSourceSection() {
	return (
		<LandingSection title={LANDING_OPEN_SOURCE.title}>
			<div className="flex flex-col items-start gap-4 text-site-body text-secondary-foreground">
				{LANDING_OPEN_SOURCE.paragraphs.map(paragraph => (
					<p key={paragraph}>{paragraph}</p>
				))}

				<a
					className="rounded-sm text-foreground underline underline-offset-4"
					href={GITHUB_URL}
				>
					{LANDING_OPEN_SOURCE.linkLabel}
				</a>
			</div>
		</LandingSection>
	)
}
