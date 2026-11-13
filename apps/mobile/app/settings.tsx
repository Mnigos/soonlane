import { SignOutButton } from '@/modules/identity/presentation/components/sign-out-button'
import { PlaceholderScreen } from '@/modules/shell/presentation/components/placeholder-screen'

export default function SettingsRoute() {
	return (
		<PlaceholderScreen
			title="Settings"
			description="Your account settings will appear here."
		>
			<SignOutButton />
		</PlaceholderScreen>
	)
}
