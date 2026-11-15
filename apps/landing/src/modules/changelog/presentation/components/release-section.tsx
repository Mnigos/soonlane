import { formatDayMonthYear, getReleaseAnchor } from '@soonlane/domain'
import { ChevronDown } from 'lucide-react'
import type { Release, ReleaseGroup } from '../../domain/release.types'
import { ReleaseChanges } from './release-changes'
import { ReleaseSummary } from './release-summary'

interface AllChangesProps {
	groups: ReleaseGroup[]
}

/** The git-cliff list under a summary, collapsed by default; native `<details>` keeps it in the prerendered HTML. */
function AllChanges({ groups }: Readonly<AllChangesProps>) {
	const count = groups.reduce((total, group) => total + group.entries.length, 0)

	return (
		<details className="group">
			<summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 rounded-sm text-label font-semibold text-secondary-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:-ml-6 [&::-webkit-details-marker]:hidden">
				<ChevronDown
					aria-hidden
					className="size-4.5 -rotate-90 text-muted-foreground transition-transform group-open:rotate-0"
				/>
				All changes
				<span className="font-normal text-muted-foreground">{count}</span>
			</summary>

			<div className="flex flex-col gap-5 pt-5">
				<ReleaseChanges groups={groups} />
			</div>
		</details>
	)
}

interface ReleaseSectionProps {
	release: Release
}

export function ReleaseSection({ release }: Readonly<ReleaseSectionProps>) {
	const anchor = getReleaseAnchor(release.version)
	const hasChanges = release.groups.length > 0

	return (
		<section
			aria-labelledby={`${anchor}-heading`}
			className="flex flex-col gap-5 pt-10"
			id={anchor}
		>
			<h2
				className="flex items-baseline justify-between gap-4 border-b pb-2 text-sm font-semibold"
				id={`${anchor}-heading`}
			>
				<a className="underline-offset-4 hover:underline" href={release.url}>
					{release.version}
				</a>

				<time
					className="font-normal text-muted-foreground"
					dateTime={release.date}
				>
					{formatDayMonthYear(release.date)}
				</time>
			</h2>

			{!release.summary && !hasChanges && (
				<p className="text-label text-muted-foreground">
					Improvements under the hood.
				</p>
			)}

			{release.summary ? (
				<>
					<ReleaseSummary summary={release.summary} />

					{hasChanges && <AllChanges groups={release.groups} />}
				</>
			) : (
				<ReleaseChanges groups={release.groups} />
			)}
		</section>
	)
}
