import { RELEASES_URL } from '@soonlane/domain'
import type { Release } from '../../domain/release.types'
import { ReleaseSection } from './release-section'

interface ChangelogPageProps {
	releases: Release[]
}

export function ChangelogPage({ releases }: Readonly<ChangelogPageProps>) {
	return (
		<main className="mx-auto w-full max-w-[680px] flex-1 px-6 py-16">
			<header className="flex flex-col gap-3">
				<h1 className="text-2xl font-bold tracking-tight">Changelog</h1>

				<p className="text-secondary-foreground">
					Every stable release of Soonlane. Nightly builds are on{' '}
					<a
						className="underline underline-offset-4 hover:text-foreground"
						href={RELEASES_URL}
					>
						GitHub Releases
					</a>
					.
				</p>
			</header>

			{releases.length === 0 ? (
				<div className="flex flex-col gap-2 pt-10 text-label">
					<p className="text-muted-foreground">
						The first stable release is on its way.
					</p>

					<a
						className="self-start text-muted-foreground underline underline-offset-4 hover:text-foreground"
						href={RELEASES_URL}
					>
						Open GitHub Releases
					</a>
				</div>
			) : (
				releases.map(release => (
					<ReleaseSection key={release.version} release={release} />
				))
			)}
		</main>
	)
}
