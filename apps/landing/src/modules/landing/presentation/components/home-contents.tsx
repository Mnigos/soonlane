import { HOME_CONTENTS } from '../home.constants'
import { HomeSection } from './home-section'

export function HomeContents() {
	return (
		<HomeSection title={HOME_CONTENTS.title}>
			<dl className="flex flex-col divide-y">
				{HOME_CONTENTS.items.map(({ name, body }) => (
					<div
						className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[12rem_1fr] sm:gap-6"
						key={name}
					>
						<dt className="text-landing-body font-semibold">{name}</dt>

						<dd className="text-landing-body text-secondary-foreground">
							{body}
						</dd>
					</div>
				))}
			</dl>
		</HomeSection>
	)
}
