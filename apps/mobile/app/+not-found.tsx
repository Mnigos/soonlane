import { PlaceholderScreen } from '@/modules/shell/presentation/components/placeholder-screen'
import { TextLink } from '@/modules/shell/presentation/components/text-link'

export default function NotFoundRoute() {
	return (
		<PlaceholderScreen
			title="Screen not found"
			description="This link does not open anything in Soonlane."
		>
			<TextLink href="/">Back to Today</TextLink>
		</PlaceholderScreen>
	)
}
