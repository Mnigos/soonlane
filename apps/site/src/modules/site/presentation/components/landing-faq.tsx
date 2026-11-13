import { LANDING_FAQ } from '../landing.constants'
import { LandingSection } from './landing-section'

export function LandingFaq() {
	return (
		<LandingSection title={LANDING_FAQ.title}>
			<div className="flex flex-col divide-y">
				{LANDING_FAQ.items.map(({ question, answer, link }) => (
					<div className="flex flex-col gap-2 py-5 first:pt-0" key={question}>
						<h3 className="text-site-body font-semibold">{question}</h3>

						<p className="text-site-body text-secondary-foreground">
							{answer}
							{link && (
								<>
									{' '}
									<a
										className="rounded-sm text-foreground underline underline-offset-4"
										href={link.href}
									>
										{link.label}
									</a>
									.
								</>
							)}
						</p>
					</div>
				))}
			</div>
		</LandingSection>
	)
}
