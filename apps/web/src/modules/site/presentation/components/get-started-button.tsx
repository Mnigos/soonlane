import { buttonVariants } from '@soonlane/ui/components/button'
import { Link } from '@tanstack/react-router'
import { TermsAgreement } from './terms-agreement'

interface GetStartedButtonProps {
	compact?: boolean
}

export function GetStartedButton({
	compact = false,
}: Readonly<GetStartedButtonProps>) {
	const button = (
		<Link
			className={buttonVariants({ size: compact ? 'sm' : 'lg' })}
			to="/login"
		>
			Get started
		</Link>
	)

	if (compact) return button

	return (
		<div className="flex flex-col items-start gap-3">
			{button}

			<TermsAgreement />
		</div>
	)
}
