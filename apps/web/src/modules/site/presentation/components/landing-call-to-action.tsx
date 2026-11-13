import { cn } from '@soonlane/ui/cn'
import { buttonVariants } from '@soonlane/ui/components/button'
import { Link } from '@tanstack/react-router'
import { GetStartedButton } from './get-started-button'

export function LandingCallToAction() {
	return (
		<>
			<Link
				className={cn(
					buttonVariants({ size: 'lg' }),
					'signed-in:inline-flex hidden'
				)}
				to="/"
			>
				Open app
			</Link>

			<div className="signed-in:hidden contents">
				<GetStartedButton />
			</div>
		</>
	)
}
