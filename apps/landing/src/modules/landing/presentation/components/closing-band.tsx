import { HOME_CLOSING_TITLE } from '../home.constants'
import { HomeCallToAction } from './home-call-to-action'
import { HomeSection } from './home-section'

export function ClosingBand() {
	return (
		<HomeSection className="lg:items-center" title={HOME_CLOSING_TITLE}>
			<HomeCallToAction />
		</HomeSection>
	)
}
