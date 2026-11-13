import { cn } from '@soonlane/ui/cn'
import { buttonVariants } from '@soonlane/ui/components/button'
import { APP_ORIGIN } from '../site-environment.constants'
import { GetStartedButton } from './get-started-button'

export function LandingCallToAction() {
	return (
		<>
			<a
				className={cn(
					buttonVariants({ size: 'lg' }),
					'signed-in:inline-flex hidden'
				)}
				href={`${APP_ORIGIN}/`}
			>
				Open app
			</a>

			<div className="signed-in:hidden contents">
				<GetStartedButton />
			</div>
		</>
	)
}
