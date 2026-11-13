import { LANDING_CLOSING_TITLE } from '../landing.constants'
import { LandingCallToAction } from './landing-call-to-action'
import { LandingSection } from './landing-section'

export function ClosingBand() {
	return (
		<LandingSection className="lg:items-center" title={LANDING_CLOSING_TITLE}>
			<LandingCallToAction />
		</LandingSection>
	)
}
