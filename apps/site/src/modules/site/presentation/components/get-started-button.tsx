import { buttonVariants } from '@soonlane/ui/components/button'
import { APP_ORIGIN } from '../site-environment.constants'
import { TermsAgreement } from './terms-agreement'

interface GetStartedButtonProps {
	compact?: boolean
}

export function GetStartedButton({
	compact = false,
}: Readonly<GetStartedButtonProps>) {
	const button = (
		<a
			className={buttonVariants({ size: compact ? 'sm' : 'lg' })}
			href={`${APP_ORIGIN}/login`}
		>
			Get started
		</a>
	)

	if (compact) return button

	return (
		<div className="flex flex-col items-start gap-3">
			{button}

			<TermsAgreement />
		</div>
	)
}
