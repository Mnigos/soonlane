import { LANDING_HERO } from '../landing.constants'
import { GITHUB_URL } from '../site.constants'
import { GithubIcon } from './github-icon'
import { LandingCallToAction } from './landing-call-to-action'
import { LandingScreenshot } from './landing-screenshot'
import { LandingSection } from './landing-section'

export function LandingHero() {
	return (
		<LandingSection className="pt-10 lg:pt-16">
			<div className="flex max-w-[720px] flex-col gap-5">
				<h1 className="text-site-display text-balance">
					{LANDING_HERO.headline}
				</h1>

				<p className="max-w-[60ch] text-site-body text-pretty text-secondary-foreground">
					{LANDING_HERO.subline}
				</p>
			</div>

			<div className="mt-8 flex flex-col items-start gap-5">
				<LandingCallToAction />

				<a
					className="inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
					href={GITHUB_URL}
				>
					<GithubIcon className="size-4" />
					{LANDING_HERO.githubLabel}
				</a>
			</div>

			{/* The padding is room for the phone to overhang the screenshot. */}
			<div className="relative mt-12 pr-[8%] pb-[10%] lg:mt-16">
				<LandingScreenshot image={LANDING_HERO.desktopImage} isPriority />

				<LandingScreenshot
					className="absolute right-0 bottom-0 w-[28%] outline-4 outline-background sm:w-[22%] lg:outline-8"
					image={LANDING_HERO.phoneImage}
				/>
			</div>
		</LandingSection>
	)
}
