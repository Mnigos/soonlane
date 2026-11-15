import { cn } from '@soonlane/ui/cn'
import type { HomeFeature } from '../home.constants'
import { HomeScreenshot } from './home-screenshot'
import { HomeSection } from './home-section'

interface FeatureRowProps {
	feature: HomeFeature
	isReversed: boolean
}

export function FeatureRow({ feature, isReversed }: Readonly<FeatureRowProps>) {
	return (
		<HomeSection
			className={cn(
				'grid items-center gap-10 lg:gap-16',
				isReversed ? 'lg:grid-cols-[7fr_5fr]' : 'lg:grid-cols-[5fr_7fr]'
			)}
		>
			<div className="flex flex-col gap-4">
				<h2 className="text-landing-title text-balance">{feature.title}</h2>

				<p className="text-landing-body text-pretty text-secondary-foreground">
					{feature.body}
				</p>
			</div>

			<HomeScreenshot
				className={cn(isReversed && 'lg:order-first')}
				image={feature.image}
			/>
		</HomeSection>
	)
}
