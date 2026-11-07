import { formatDayMonthYear } from '@/modules/tasks/domain/calendar-date.helper'
import { getReleaseAnchor } from '../../domain/release-anchor.helper'
import type {
	Release,
	ReleaseEntry,
	ReleaseGroup,
} from '../../domain/release.types'

const RELEASE_KINDS = [
	{ kind: 'feature', label: 'New' },
	{ kind: 'fix', label: 'Fixed' },
	{ kind: 'performance', label: 'Faster' },
] as const satisfies { kind: ReleaseGroup['kind']; label: string }[]

const SCOPE_LABELS: Partial<Record<string, string>> = {
	tasks: 'Tasks',
	labels: 'Labels',
	shell: 'Sidebar',
	desktop: 'Mac app',
	identity: 'Sign-in',
	site: 'Website',
	blog: 'Blog',
	changelog: 'Changelog',
	consent: 'Privacy',
}

interface ReleaseEntryRowProps {
	entry: ReleaseEntry
	scope: string
}

function ReleaseEntryRow({ entry, scope }: Readonly<ReleaseEntryRowProps>) {
	const scopeLabel = SCOPE_LABELS[scope]
	const href = entry.pullRequestUrl ?? entry.commitUrl
	const reference = href.split('/').at(-1)

	return (
		<li className="flex flex-col gap-0.5">
			<p className="text-sm text-foreground">{entry.text}</p>

			<p className="flex gap-3 text-caption text-muted-foreground">
				{scopeLabel && <span>{scopeLabel}</span>}

				<a
					className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
					href={href}
				>
					{entry.pullRequestUrl ? `#${reference}` : reference?.slice(0, 7)}
				</a>
			</p>
		</li>
	)
}

interface ReleaseSectionProps {
	release: Release
}

export function ReleaseSection({ release }: Readonly<ReleaseSectionProps>) {
	const anchor = getReleaseAnchor(release.version)

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

			{release.groups.length === 0 && (
				<p className="text-label text-muted-foreground">
					Improvements under the hood.
				</p>
			)}

			{RELEASE_KINDS.map(({ kind, label }) => {
				const groups = release.groups.filter(group => group.kind === kind)

				if (groups.length === 0) return null

				return (
					<div className="flex flex-col gap-3" key={kind}>
						<h3 className="text-label font-semibold text-secondary-foreground">
							{label}
						</h3>

						<ul className="flex flex-col gap-3">
							{groups.flatMap(group =>
								group.entries.map(entry => (
									<ReleaseEntryRow
										entry={entry}
										key={entry.commitUrl}
										scope={group.scope}
									/>
								))
							)}
						</ul>
					</div>
				)
			})}
		</section>
	)
}
