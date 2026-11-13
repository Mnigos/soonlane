import { Link } from '@tanstack/react-router'

const LEGAL_LINK_CLASS = 'text-foreground underline underline-offset-2'

export function TermsAgreement() {
	return (
		<p className="text-caption text-muted-foreground">
			By continuing you agree to the{' '}
			<Link className={LEGAL_LINK_CLASS} to="/terms">
				Terms
			</Link>{' '}
			and the{' '}
			<Link className={LEGAL_LINK_CLASS} to="/privacy">
				Privacy Policy
			</Link>
			.
		</p>
	)
}
