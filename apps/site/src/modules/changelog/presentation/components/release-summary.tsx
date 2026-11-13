import type {
	ReleaseSummary as ReleaseSummaryData,
	ReleaseText as ReleaseTextData,
} from '../../domain/release.types'

interface ReleaseTextProps {
	text: ReleaseTextData
}

function ReleaseText({ text }: Readonly<ReleaseTextProps>) {
	return text.map(({ text: segment, href }, index) =>
		href ? (
			<a
				className="underline underline-offset-4 transition-colors hover:text-muted-foreground"
				href={href}
				// oxlint-disable-next-line no-array-index-key -- segments never reorder
				key={index}
			>
				{segment}
			</a>
		) : (
			segment
		)
	)
}

interface ReleaseSummaryProps {
	summary: ReleaseSummaryData
}

/** The summary written for users: paragraphs, then feature areas with bullet entries. */
export function ReleaseSummary({ summary }: Readonly<ReleaseSummaryProps>) {
	return (
		<>
			{summary.paragraphs.map(paragraph => (
				<p
					className="text-sm text-foreground"
					key={paragraph.map(segment => segment.text).join('')}
				>
					<ReleaseText text={paragraph} />
				</p>
			))}

			{summary.areas.map(area => (
				<div className="flex flex-col gap-3" key={area.title}>
					<h3 className="text-label font-semibold text-secondary-foreground">
						{area.title}
					</h3>

					<ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-foreground marker:text-muted-foreground">
						{area.entries.map(entry => (
							<li key={entry.map(segment => segment.text).join('')}>
								<ReleaseText text={entry} />
							</li>
						))}
					</ul>
				</div>
			))}
		</>
	)
}
