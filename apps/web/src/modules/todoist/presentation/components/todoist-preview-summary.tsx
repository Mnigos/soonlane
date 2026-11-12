import type { TodoistPreview } from '@soonlane/contracts'
import { TODOIST_IMPORT_CHANGES } from '@soonlane/domain'
import { formatCount } from '../helpers/plural-copy.helper'
import {
	TODOIST_CHANGE_COPY,
	TODOIST_COPY,
	TODOIST_COUNT_COPY,
} from '../helpers/todoist-copy.constants'

interface TodoistPreviewSummaryProps {
	preview: TodoistPreview
}

/** What an import would bring in, then every change it makes on the way; counts of zero are left out. */
export function TodoistPreviewSummary({
	preview,
}: Readonly<TodoistPreviewSummaryProps>) {
	const changes = TODOIST_IMPORT_CHANGES.filter(
		change => preview.changes[change] > 0
	)
	const countLines = [
		{ count: preview.newLabels, copy: TODOIST_COUNT_COPY.newLabels },
		{ count: preview.existingLabels, copy: TODOIST_COUNT_COPY.existingLabels },
		{ count: preview.newProjects, copy: TODOIST_COUNT_COPY.newProjects },
		{
			count: preview.existingProjects,
			copy: TODOIST_COUNT_COPY.existingProjects,
		},
	]
		.filter(({ count }) => count > 0)
		.map(({ count, copy }) => formatCount(count, copy))

	return (
		<div className="flex flex-col gap-4 text-sm">
			{preview.tasks === 0 ? (
				<p className="text-secondary-foreground">{TODOIST_COPY.nothing}</p>
			) : (
				<div className="flex flex-col gap-1">
					<p className="font-semibold">
						{[
							formatCount(preview.tasks, TODOIST_COUNT_COPY.tasks),
							formatCount(
								preview.newLabels + preview.existingLabels,
								TODOIST_COUNT_COPY.labels
							),
							formatCount(
								preview.newProjects + preview.existingProjects,
								TODOIST_COUNT_COPY.projects
							),
						].join(' · ')}
					</p>

					{countLines.map(line => (
						<p className="text-secondary-foreground" key={line}>
							{line}
						</p>
					))}
				</div>
			)}

			<section className="flex flex-col gap-2">
				<h2 className="font-semibold">{TODOIST_COPY.changesHeading}</h2>

				<ul className="flex list-disc flex-col gap-1 pl-5 text-secondary-foreground">
					{changes.map(change => (
						<li key={change}>
							{formatCount(
								preview.changes[change],
								TODOIST_CHANGE_COPY[change]
							)}
						</li>
					))}

					<li>{TODOIST_COPY.notImported}</li>
				</ul>
			</section>

			<p className="text-muted-foreground">{TODOIST_COPY.nextStep}</p>
		</div>
	)
}
