import { HOME_HERO } from '../home.constants'
import { GITHUB_URL } from '../landing.constants'
import { GithubIcon } from './github-icon'
import { HomeCallToAction } from './home-call-to-action'
import { HomeScreenshot } from './home-screenshot'
import { HomeSection } from './home-section'

export function HomeHero() {
	return (
		<HomeSection className="pt-10 lg:pt-16">
			<div className="flex max-w-[720px] flex-col gap-5">
				<h1 className="text-landing-display text-balance">
					{HOME_HERO.headline}
				</h1>

				<p className="max-w-[60ch] text-landing-body text-pretty text-secondary-foreground">
					{HOME_HERO.subline}
				</p>
			</div>

			<div className="mt-8 flex flex-col items-start gap-5">
				<HomeCallToAction />

				<p className="signed-in:hidden text-sm text-secondary-foreground">
					{HOME_HERO.todoistImportLine}
				</p>

				<a
					className="inline-flex items-center gap-2 rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
					href={GITHUB_URL}
				>
					<GithubIcon className="size-4" />
					{HOME_HERO.githubLabel}
				</a>
			</div>

			{/* The padding is room for the phone to overhang the screenshot. */}
			<div className="relative mt-12 pr-[8%] pb-[10%] lg:mt-16">
				<HomeScreenshot image={HOME_HERO.desktopImage} isPriority />

				<HomeScreenshot
					className="absolute right-0 bottom-0 w-[28%] outline-4 outline-background sm:w-[22%] lg:outline-8"
					image={HOME_HERO.phoneImage}
				/>
			</div>
		</HomeSection>
	)
}
