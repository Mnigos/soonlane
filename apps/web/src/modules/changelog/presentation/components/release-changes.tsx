import type { ReleaseEntry, ReleaseGroup } from '../../domain/release.types'

const RELEASE_KINDS = [
	{ kind: 'feature', label: 'New' },
	{ kind: 'fix', label: 'Fixed' },
	{ kind: 'performance', label: 'Faster' },
] as const satisfies { kind: ReleaseGroup['kind']; label: string }[]

const SCOPE_LABELS: Partial<Record<string, string>> = {
	tasks: 'Tasks',
	labels: 'Labels',
	projects: 'Projects',
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

interface ReleaseChangesProps {
	groups: ReleaseGroup[]
}

/** git-cliff's list of a release: one entry per product commit, grouped as New, Fixed and Faster. */
export function ReleaseChanges({ groups }: Readonly<ReleaseChangesProps>) {
	return RELEASE_KINDS.map(({ kind, label }) => {
		const kindGroups = groups.filter(group => group.kind === kind)

		if (kindGroups.length === 0) return null

		return (
			<div className="flex flex-col gap-3" key={kind}>
				<h3 className="text-label font-semibold text-secondary-foreground">
					{label}
				</h3>

				<ul className="flex flex-col gap-3">
					{kindGroups.flatMap(group =>
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
	})
}
