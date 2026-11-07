import { Button } from '@soonlane/ui/components/button'
import { CONSENT_COPY } from '../consent-copy.constants'
import { useConsent } from '../hooks/use-consent'
import { PrivacyChoicesButton } from './privacy-choices-button'

const TITLE_ID = 'consent-banner-title'
const BODY_ID = 'consent-banner-body'

export function ConsentBanner() {
	const { choose } = useConsent()

	return (
		<section
			aria-describedby={BODY_ID}
			aria-labelledby={TITLE_ID}
			className="sticky bottom-4 z-20 mx-4 mb-4 rounded-lg border bg-popover p-4 shadow-lg sm:ml-auto sm:w-96"
		>
			<h2 className="text-sm font-semibold" id={TITLE_ID}>
				{CONSENT_COPY.bannerTitle}
			</h2>

			<p className="mt-1 text-label text-muted-foreground" id={BODY_ID}>
				{CONSENT_COPY.bannerBody}
			</p>

			<div className="mt-3 flex items-center gap-2">
				<Button
					onClick={() => choose('denied', 'banner')}
					size="sm"
					variant="outline"
				>
					{CONSENT_COPY.reject}
				</Button>

				<Button
					onClick={() => choose('granted', 'banner')}
					size="sm"
					variant="outline"
				>
					{CONSENT_COPY.accept}
				</Button>

				<PrivacyChoicesButton className="ml-auto cursor-pointer rounded-sm text-label text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
			</div>
		</section>
	)
}
