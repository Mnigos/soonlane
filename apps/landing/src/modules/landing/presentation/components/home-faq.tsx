import { HOME_FAQ } from '../home.constants'
import { HomeSection } from './home-section'

export function HomeFaq() {
	return (
		<HomeSection title={HOME_FAQ.title}>
			<div className="flex flex-col divide-y">
				{HOME_FAQ.items.map(({ question, answer, link }) => (
					<div className="flex flex-col gap-2 py-5 first:pt-0" key={question}>
						<h3 className="text-landing-body font-semibold">{question}</h3>

						<p className="text-landing-body text-secondary-foreground">
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
		</HomeSection>
	)
}
