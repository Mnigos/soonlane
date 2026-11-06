import { SIGNED_IN_HINT_COOKIE } from '@soonlane/auth'
import { buttonVariants } from '@soonlane/ui/components/button'
import { Link } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { GITHUB_URL, SITE_NAME, SITE_PAGE_LINKS } from '../site.constants'
import { GetStartedButton } from './get-started-button'
import { GithubIcon } from './github-icon'

// Cookies have no change event; React reads the snapshot again on every render.
function subscribe() {
	return () => undefined
}

function hasSignedInHint() {
	return document.cookie.split('; ').includes(`${SIGNED_IN_HINT_COOKIE}=1`)
}

export function SiteHeader() {
	// The prerendered HTML is signed out; after hydration the browser reads the hint cookie.
	const isSignedIn = useSyncExternalStore(
		subscribe,
		hasSignedInHint,
		() => false
	)

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
							className={buttonVariants({ variant: 'ghost', size: 'sm' })}
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

				{isSignedIn ? (
					<Link className={buttonVariants({ size: 'sm' })} to="/app">
						Open app
					</Link>
				) : (
					<>
						<Link
							className={buttonVariants({ variant: 'ghost', size: 'sm' })}
							to="/login"
						>
							Log in
						</Link>

						<GetStartedButton compact />
					</>
				)}
			</div>
		</header>
	)
}
