import { buttonVariants } from '@soonlane/ui/components/button'
import { Link } from '@tanstack/react-router'
import { useSignedInHint } from '../hooks/use-signed-in-hint'
import { GetStartedButton } from './get-started-button'

export function LandingCallToAction() {
	const isSignedIn = useSignedInHint()

	if (isSignedIn)
		return (
			<Link className={buttonVariants({ size: 'lg' })} to="/app">
				Open app
			</Link>
		)

	return <GetStartedButton />
}
