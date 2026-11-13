import { cn } from '@soonlane/ui/cn'
import { buttonVariants } from '@soonlane/ui/components/button'
import { Link } from '@tanstack/react-router'
import { APP_ORIGIN } from '../site-environment.constants'
import { GITHUB_URL, SITE_NAME, SITE_PAGE_LINKS } from '../site.constants'
import { GetStartedButton } from './get-started-button'
import { GithubIcon } from './github-icon'

export function SiteHeader() {
	return (
		<header className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
			<Link className="flex items-center gap-2 rounded-md font-bold" to="/">
				<img alt="" height={24} src="/favicon.svg" width={24} />
				{SITE_NAME}
			</Link>

			<div className="flex items-center gap-1 sm:gap-2">
				<nav aria-label="Site" className="flex items-center gap-1">
					{SITE_PAGE_LINKS.map(({ label, to }) => (
						<Link
							className={cn(
								buttonVariants({ variant: 'ghost', size: 'sm' }),
								'hidden sm:inline-flex'
							)}
							key={label}
							to={to}
						>
							{label}
						</Link>
					))}

					<a
						aria-label="Soonlane on GitHub"
						className={buttonVariants({ variant: 'ghost', size: 'icon' })}
						href={GITHUB_URL}
					>
						<GithubIcon />
					</a>
				</nav>

				<a
					className={cn(
						buttonVariants({ size: 'sm' }),
						'signed-in:inline-flex hidden'
					)}
					href={`${APP_ORIGIN}/`}
				>
					Open app
				</a>

				<div className="signed-in:hidden contents">
					<a
						className={buttonVariants({ variant: 'ghost', size: 'sm' })}
						href={`${APP_ORIGIN}/login`}
					>
						Log in
					</a>

					<GetStartedButton compact />
				</div>
			</div>
		</header>
	)
}
