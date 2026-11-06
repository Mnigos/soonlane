import { cn } from '@soonlane/ui/cn'
import type { LandingFeature } from '../landing.constants'
import { LandingScreenshot } from './landing-screenshot'
import { LandingSection } from './landing-section'

interface FeatureRowProps {
	feature: LandingFeature
	isReversed: boolean
}

export function FeatureRow({ feature, isReversed }: Readonly<FeatureRowProps>) {
	return (
		<LandingSection
			className={cn(
				'grid items-center gap-10 lg:gap-16',
				isReversed ? 'lg:grid-cols-[7fr_5fr]' : 'lg:grid-cols-[5fr_7fr]'
			)}
		>
			<div className="flex flex-col gap-4">
				<h2 className="text-site-title text-balance">{feature.title}</h2>

				<p className="text-site-body text-pretty text-secondary-foreground">
					{feature.body}
				</p>
			</div>

			<LandingScreenshot
				className={cn(isReversed && 'lg:order-first')}
				image={feature.image}
			/>
		</LandingSection>
	)
}
